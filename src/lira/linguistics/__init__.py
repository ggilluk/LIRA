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

The lexicon (Dictionary, DictionaryEntry), PartOfSpeech, Word, and
Punctuation, and everything that seeds/looks up/hydrates the lexicon
(DictionaryProcessor, AsyncDictionaryHydrator, ExternalDictionaryAdapter)
live in the Vocabulary Layer, not here -- GraphProcessor takes a
lira.vocabulary DictionaryProcessor to resolve tokens, and Clause.tokens
/ClauseSegmentationUtility reference Word and Punctuation only as
string-quoted, unimported type hints (Rule 17: Vocabulary contains
lexical inventory only); GraphProcessor itself imports them locally,
deferred until first call, since it actually constructs and
isinstance-checks them rather than just holding a type hint."""

from .role.clause_segmentation import ClauseSegmentationUtility
from .role.grammar_configurator import GrammarConfigurator
from .role.graph_processor import GraphProcessor
from .role.lexer import LinguisticLexer
from .role.linguistic_controller import LinguisticController
from .role.prompt_tokenizer import PromptTokenizer
from .data.system_property import LinguisticSystemProperty, SystemPropertyRef
from .data.tensor import LinguisticSystemPropertyTensor
from .data.clause import Clause
from .data.linguistic_relation_type import LinguisticRelationType
from .data.linguistic_unit import LinguisticUnit
from .data.linguistic_unit_kind import LinguisticUnitKind
from .data.paragraph import Paragraph
from .data.sentence import Sentence
from .data.subject import Subject
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
]
