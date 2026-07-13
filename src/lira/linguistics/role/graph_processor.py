"""Builds the Word/Punctuation -> Clause -> Sentence -> Paragraph ->
Subject tree from raw text, attaching a tensor-backed
LinguisticSystemProperty to every unit it creates."""

import uuid
from typing import List, Union

from .clause_segmentation import ClauseSegmentationUtility
from ..data.grammar_configuration import LinguisticGrammarConfiguration
from .lexer import LinguisticLexer
from ..data.system_property import LinguisticSystemProperty, SystemPropertyRef
from ..data.tensor import LinguisticSystemPropertyTensor
from ..data.clause import Clause
from ..data.linguistic_unit import LinguisticUnit
from ..data.linguistic_unit_kind import LinguisticUnitKind
from ..data.paragraph import Paragraph
from ..data.punctuation import Punctuation
from ..data.sentence import Sentence
from ..data.subject import Subject
from ..data.word import Word

# DictionaryProcessor (lira.vocabulary) is used only as a type hint here --
# Linguistics never constructs or inspects one, just calls the instance it's
# given. Left unimported (not even under typing.TYPE_CHECKING) because
# Vocabulary's own modules import Linguistics's word.py/punctuation.py/
# part_of_speech.py, and a top-level import here would form an
# import-time cycle between the two layers.


class GraphProcessor:
    def __init__(self, dict_processor: "DictionaryProcessor", config: LinguisticGrammarConfiguration,
                 store: LinguisticSystemPropertyTensor, use_clause_segmentation: bool = True):
        self.dict_processor = dict_processor
        self.config = config
        self.store = store
        self.use_clause_segmentation = use_clause_segmentation

    def create_property_wrapper(self, unit: LinguisticUnit, kind: LinguisticUnitKind, seq: int, origin: str) -> LinguisticSystemProperty:
        row = self.store.allocate_row(
            kind=kind, sequence_number=seq,
            uuid_str=f"{kind.value.lower()}-{uuid.uuid4().hex[:6]}",
            linguistic_unit=unit, concept_system_property=SystemPropertyRef(),
            confidence=0.95, activation=1.0, origin=origin,
        )
        return LinguisticSystemProperty(self.store, row)

    def process_token(self, text_token: str, absolute_seq_num: int) -> Union[Word, Punctuation]:
        entry = self.dict_processor.get_or_create_entry(text_token)
        if isinstance(entry.unit, Punctuation):
            node = Punctuation(text=text_token, symbol=text_token)
            node.system_property = self.create_property_wrapper(node, LinguisticUnitKind.Punctuation, absolute_seq_num, "Lexer_TokenLayer")
            return node

        node = Word(text=text_token, part_of_speech=entry.parts_of_speech[0], definition=entry.meaning)
        node.system_property = self.create_property_wrapper(node, LinguisticUnitKind.Word, absolute_seq_num, "Lexer_TokenLayer")
        return node

    def process_sentence(self, raw_sentence_text: str, seq_num: int) -> Sentence:
        raw_tokens = LinguisticLexer.extract_tokens(raw_sentence_text)
        all_processed_tokens = [self.process_token(tok, abs_idx) for abs_idx, tok in enumerate(raw_tokens)]
        compiled_clauses: List[Clause] = []

        if self.use_clause_segmentation:
            token_buckets = ClauseSegmentationUtility.slice_tokens_into_clauses(all_processed_tokens, self.config)
            for c_idx, bucket in enumerate(token_buckets):
                reconstructed_text = " ".join([t.text for t in bucket])
                clause_node = Clause(text=reconstructed_text, tokens=bucket, is_independent=True)
                clause_node.system_property = self.create_property_wrapper(clause_node, LinguisticUnitKind.Clause, c_idx, "GraphProcessor_MultiClauseLayer")
                compiled_clauses.append(clause_node)
        else:
            clause_node = Clause(text=raw_sentence_text.strip(), tokens=all_processed_tokens, is_independent=True)
            clause_node.system_property = self.create_property_wrapper(clause_node, LinguisticUnitKind.Clause, 0, "GraphProcessor_MonoClauseLayer")
            compiled_clauses.append(clause_node)

        has_punc = any(isinstance(t, Punctuation) for t in all_processed_tokens)
        node = Sentence(text=raw_sentence_text.strip(), clauses=compiled_clauses, requires_punctuation=has_punc)
        node.system_property = self.create_property_wrapper(node, LinguisticUnitKind.Sentence, seq_num, "GraphProcessor_SentenceLayer")
        return node

    def process_paragraph(self, raw_paragraph_text: str, seq_num: int) -> Paragraph:
        raw_sentence_strings = LinguisticLexer.split_sentences(raw_paragraph_text, self.config)
        compiled_sentences = [self.process_sentence(s, idx) for idx, s in enumerate(raw_sentence_strings) if s]

        node = Paragraph(text=raw_paragraph_text.strip(), sentences=compiled_sentences)
        node.system_property = self.create_property_wrapper(node, LinguisticUnitKind.Paragraph, seq_num, "GraphProcessor_ParagraphLayer")
        return node

    def process_subject(self, raw_subject_text: str, seq_num: int) -> Subject:
        raw_paragraph_strings = [p.strip() for p in raw_subject_text.strip().split('\n') if p.strip()]
        compiled_paragraphs = [self.process_paragraph(p, idx) for idx, p in enumerate(raw_paragraph_strings)]

        node = Subject(text=raw_subject_text.strip(), paragraphs=compiled_paragraphs)
        node.system_property = self.create_property_wrapper(node, LinguisticUnitKind.Subject, seq_num, "GraphProcessor_SubjectLayer")
        return node
