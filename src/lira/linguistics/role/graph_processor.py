"""Builds the Word -> Clause -> Sentence -> Paragraph -> Subject tree
from raw text, attaching a tensor-backed LinguisticSystemProperty to
every unit it creates."""

import uuid
from typing import List, Tuple

from .clause_segmentation import ClauseSegmentationUtility
from .grammar_configurator import GrammarConfigurator
from .lexer import LinguisticLexer
from ..data.system_property import LinguisticSystemProperty, SystemPropertyRef
from ..data.tensor import LinguisticSystemPropertyTensor
from ..data.clause import Clause
from ..data.linguistic_unit import LinguisticUnit
from ..data.linguistic_unit_kind import LinguisticUnitKind
from ..data.paragraph import Paragraph
from ..data.sentence import Sentence
from ..data.subject import Subject

# DictionaryProcessor, Word, PartOfSpeech (lira.vocabulary) are used
# only as type hints at module scope here -- Vocabulary's own modules
# import Linguistics's linguistic_unit.py (Word subclasses it), so a
# top-level import here would form an import-time cycle between the two
# layers. process_token/process_sentence below import Word and
# PartOfSpeech locally instead, deferred until first call, by which
# point both packages have finished loading.


class GraphProcessor:
    def __init__(self, dict_processor: "DictionaryProcessor", config: GrammarConfigurator,
                 store: LinguisticSystemPropertyTensor, use_clause_segmentation: bool = True):
        self.dict_processor = dict_processor
        self.config = config
        self.store = store
        self.use_clause_segmentation = use_clause_segmentation

    def create_property_wrapper(self, unit: LinguisticUnit, kind: LinguisticUnitKind, seq: int, origin: str) -> LinguisticSystemProperty:
        row = self.store.allocate_row(
            kind=kind, sequence_number=seq,
            uuid_str=f"{kind.name.lower()}-{uuid.uuid4().hex[:6]}",
            linguistic_unit=unit, concept_system_property=SystemPropertyRef(),
            confidence=0.95, activation=1.0, origin=origin,
        )
        return LinguisticSystemProperty(self.store, row)

    def process_token(
        self, text_token: str, absolute_seq_num: int, *,
        sentence_index: int = 0, token_index: int = 0, is_sentence_start: bool = False,
        preceding_words: Tuple[str, ...] = (), following_words: Tuple[str, ...] = (),
    ) -> "Word":
        import copy

        from lira.value_objects import Text
        from lira.vocabulary import PartOfSpeech, Word

        candidates = self.dict_processor.identify_word(
            text_token,
            sentence_index=sentence_index, token_index=token_index, is_sentence_start=is_sentence_start,
            preceding_words=preceding_words, following_words=following_words,
        )

        if candidates:
            # Highest-confidence candidate for this occurrence
            # (DictionaryProcessor.identify_word already ranks them).
            # word is always the Dictionary's canonical Word (its
            # *type*, punctuation included -- see
            # dictionary_processor.py) -- copy it so this occurrence
            # (its *token*) gets its own identity and system_property
            # row, without mutating the canonical entry. Selecting
            # among more than one candidate for THIS sentence occurrence
            # (semantic disambiguation, as opposed to this ranking by
            # occurrence-level orthographic evidence) is Linguistics
            # Layer work not yet built -- see
            # linguistics/documentation/README.md.
            node = copy.copy(candidates[0].word)
        else:
            # No seeded or previously-hydrated sense exists yet.
            # identify_word has already queued external hydration, but
            # that resolves asynchronously and won't be ready before
            # this call returns, so this occurrence gets a transient,
            # unclassified node of its own -- never added to the
            # Dictionary, since an unresolved occurrence must not enter
            # the authoritative vocabulary as a guess (vocabulary/data/word_identification.py).
            node = Word(
                text=text_token,
                part_of_speech=PartOfSpeech.OTHER,
                definition=Text(value="Pending external hydration; part of speech not yet identified."),
                is_common=False,
                is_fully_hydrated=False,
            )

        # This occurrence's own casing, not the canonical Word's --
        # Clause/Sentence text is reconstructed from token text
        # (process_sentence below), so it must reflect what was
        # actually written, not the Dictionary's seed-data casing.
        node.text = text_token

        kind = LinguisticUnitKind.Punctuation if node.part_of_speech == PartOfSpeech.PUNCTUATION else LinguisticUnitKind.Word

        node.system_property = self.create_property_wrapper(node, kind, absolute_seq_num, "Lexer_TokenLayer")
        return node

    def process_sentence(self, raw_sentence_text: str, seq_num: int) -> Sentence:
        from lira.vocabulary import PartOfSpeech

        raw_tokens = LinguisticLexer.extract_tokens(raw_sentence_text)
        all_processed_tokens = [
            self.process_token(
                tok, idx,
                sentence_index=seq_num, token_index=idx, is_sentence_start=(idx == 0),
                preceding_words=tuple(raw_tokens[:idx]), following_words=tuple(raw_tokens[idx + 1:]),
            )
            for idx, tok in enumerate(raw_tokens)
        ]
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

        has_punc = any(t.part_of_speech == PartOfSpeech.PUNCTUATION for t in all_processed_tokens)
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
