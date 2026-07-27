from typing import List, Optional

from .clause_reader import ClauseReader
from .graph_processor import GraphProcessor
from .grammar_configurator import GrammarConfigurator
from .lexer import LinguisticLexer
from .phrase_reader import PhraseReader
from .prompt_tokenizer import PromptTokenizer
from .reading_context import ReadingContext
from .sentence_reader import SentenceReader
from .sequence_engine import SequenceEngine
from .token_resolver import TokenResolver
from ..data.sentence import Sentence
from ..data.tensor import LinguisticSystemPropertyTensor
from ..data.subject import Subject
from ..ui.user_prompt import UserPrompt

# DictionaryProcessor, LexicalRelationshipStore (lira.vocabulary) are
# used only as type hints here -- see graph_processor.py for why
# they're deliberately left unimported at module scope.


class LinguisticController:
    def __init__(
        self,
        dictionary_processor: "DictionaryProcessor",
        use_clause_segmentation: bool = True,
        lexical_relationships: "Optional[LexicalRelationshipStore]" = None,
    ):
        """dictionary_processor: Vocabulary owns the lexicon (Rule 17);
        Linguistics resolves tokens through it rather than keeping its
        own copy (typically Domain.vocabulary.dictionary_processor).
        lexical_relationships: plumbed through for Phase 2 (real
        morphological agreement scoring -- see linguistics/documentation/
        README.md, Not Yet Built); no Phase 1 reader consults it. Added
        now, as a one-time constructor signature change, so Domain's own
        wiring (knowledge/data/domain.py) doesn't need a second breaking
        change once Phase 2 lands."""
        self.grammar_configurator = GrammarConfigurator()
        # A typo in a rule table fails here, at construction time, not
        # mid-parse (grammar_configurator.py's own docstring on this
        # method).
        self.grammar_configurator.validate_against_vocabulary()

        self.tensor = LinguisticSystemPropertyTensor()  # persistent, canonical store for every unit's numeric fields (Rule 14)
        self.graph_processor = GraphProcessor(dictionary_processor, self.grammar_configurator, self.tensor, use_clause_segmentation)
        self.tokenizer = PromptTokenizer(self.graph_processor)
        self.lexical_relationships = lexical_relationships

        sequence_engine = SequenceEngine(self.grammar_configurator)
        token_resolver = TokenResolver(self.graph_processor)
        phrase_reader = PhraseReader(sequence_engine, self.graph_processor, self.grammar_configurator)
        clause_reader = ClauseReader(phrase_reader, sequence_engine, self.grammar_configurator)
        sentence_reader = SentenceReader(clause_reader, token_resolver, sequence_engine, self.grammar_configurator)

        # Built once, held for the controller's lifetime -- every
        # Phrase.read()/Clause.read()/Sentence.read() call reaches these
        # same shared services through this bundle (role/reading_context.py's
        # own docstring; spec 9's "Sentence.read() -> LinguisticController
        # -> shared sequencing services").
        self.reading_context = ReadingContext(
            grammar=self.grammar_configurator, sequence_engine=sequence_engine, token_resolver=token_resolver,
            phrase_reader=phrase_reader, clause_reader=clause_reader, sentence_reader=sentence_reader,
            graph_processor=self.graph_processor,
        )

    def tokenize_prompt(self, prompt: UserPrompt) -> Subject:
        return self.tokenizer.tokenize_prompt(prompt)

    def read_sentence(self, text: str, *, trace: Optional[List[dict]] = None) -> Sentence:
        """Reads `text` as exactly one sentence (spec 14.3) -- delegates
        to the shared SentenceReader via reading_context, never
        re-implements sequencing here (spec 9). `trace`, when a list is
        passed, is filled with one record per token position describing
        every phrase type PhraseReader.read() attempted there -- see
        that method's own docstring (role/phrase_reader.py) and
        ui/sentence_reader_server.py, the one consumer of this."""
        return self.reading_context.sentence_reader.read(text, grammar=self.grammar_configurator, trace=trace)

    def read_text(self, text: str) -> List[Sentence]:
        """Splits `text` into sentences the same way tokenize_prompt's
        write path does (LinguisticLexer.split_sentences), then reads
        each one independently via the shared SentenceReader -- this
        phase has no cross-sentence discourse structure to preserve
        (spec 22's own out-of-scope list includes "discourse analysis"),
        so each Sentence.read() call stands alone."""
        raw_sentences = LinguisticLexer.split_sentences(text, self.grammar_configurator)
        return [
            self.reading_context.sentence_reader.read(sentence_text, grammar=self.grammar_configurator, sequence_number=idx)
            for idx, sentence_text in enumerate(raw_sentences)
            if sentence_text
        ]
