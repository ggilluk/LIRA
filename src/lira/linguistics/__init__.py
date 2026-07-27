"""Linguistics Layer: grammar/syntax-level processing (parsing,
morphology) that feeds concept and relationship extraction (Layer
Summary: Linguistics Layer). Contains language structure only (Rule 18).

Repository layout follows Architectural Layer -> artefact purpose:
data/ (the Clause/Sentence/Paragraph/Subject tree,
LinguisticSystemPropertyTensor), agents/ (LinguisticsAgent base -- no
concrete subclasses yet), role/ (LinguisticController -- wires the rest
of this layer together, same as DomainController does for Domain --
GraphProcessor, PromptTokenizer, LinguisticLexer,
ClauseSegmentationUtility, GrammarConfigurator -- Linguistics doesn't use
the *Agent-subclass convention the other three layers use, since this
processing doesn't decompose cleanly into that shape, but every one of
these classes still plays an active role rather than just holding
state), documentation/, api/, ui/ (UserPrompt, the raw input at the
boundary), assets/.

The lexicon (Dictionary), PartOfSpeech, and Word, and everything that
seeds/looks up/hydrates the lexicon (DictionaryProcessor,
AsyncDictionaryHydrator, ExternalDictionaryAdapter) live in the
Vocabulary Layer, not here -- GraphProcessor takes a lira.vocabulary
DictionaryProcessor to resolve tokens, and Clause.tokens
/ClauseSegmentationUtility reference Word only as a string-quoted,
unimported type hint (Rule 17: Vocabulary contains lexical inventory
only); GraphProcessor itself imports it locally, deferred until first
call, since it actually constructs Word instances rather than just
holding a type hint. There is no separate Punctuation class -- a
punctuation mark is a Word with part_of_speech=PartOfSpeech.PUNCTUATION;
GraphProcessor.process_token derives a token's LinguisticUnitKind (Word
vs Punctuation) from that field instead of an isinstance check."""

from .role.clause_reader import ClauseReader
from .role.clause_segmentation import ClauseSegmentationUtility
from .role.grammar_configurator import GrammarConfigurator
from .role.graph_processor import GraphProcessor
from .role.lexer import LinguisticLexer
from .role.linguistic_controller import LinguisticController
from .role.phrase_reader import PhraseReader
from .role.prompt_tokenizer import PromptTokenizer
from .role.reading_context import ReadingContext
from .role.reading_scorer import ReadingScorer, ScoringFactors
from .role.sentence_reader import SentenceReader
from .role.sequence_engine import SequenceEngine
from .role.token_resolver import TokenResolver
from .data.system_property import LinguisticSystemProperty, SystemPropertyRef
from .data.tensor import LinguisticSystemPropertyTensor
from .data.clause import Clause
from .data.clause_type import ClauseType
from .data.interpretation import Interpretation
from .data.linguistic_relation_type import LinguisticRelationType
from .data.linguistic_scope import LinguisticScope
from .data.linguistic_unit import LinguisticUnit
from .data.linguistic_unit_kind import LinguisticUnitKind
from .data.paragraph import Paragraph
from .data.phrase import Phrase
from .data.phrase_type import PhraseType
from .data.reading_error import ReadingError, ReadingErrorKind
from .data.sentence import Sentence
from .data.sentence_type import SentenceType
from .data.sequencing_obligation import ObligationKind, SequencingObligation
from .data.subject import Subject
from .data.token_reading import TokenReading
from .data.validation_outcome import ValidationOutcome
from .ui.user_prompt import UserPrompt

__all__ = [
    "LinguisticController",
    "GrammarConfigurator",
    "LinguisticLexer",
    "ClauseSegmentationUtility",
    "GraphProcessor",
    "PromptTokenizer",
    "SystemPropertyRef",
    "LinguisticSystemProperty",
    "LinguisticSystemPropertyTensor",
    "LinguisticUnitKind",
    "LinguisticRelationType",
    "LinguisticUnit",
    "UserPrompt",
    "Clause",
    "Sentence",
    "Paragraph",
    "Subject",
    # Read-only sentence sequencing (Phrase.read()/Clause.read()/Sentence.read())
    "Phrase",
    "PhraseType",
    "ClauseType",
    "SentenceType",
    "LinguisticScope",
    "ObligationKind",
    "SequencingObligation",
    "ValidationOutcome",
    "ReadingError",
    "ReadingErrorKind",
    "TokenReading",
    "Interpretation",
    "ReadingContext",
    "SequenceEngine",
    "ReadingScorer",
    "ScoringFactors",
    "TokenResolver",
    "PhraseReader",
    "ClauseReader",
    "SentenceReader",
]
