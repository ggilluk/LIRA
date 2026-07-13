"""Linguistics Layer: grammar/syntax-level processing (parsing,
morphology) that feeds concept and relationship extraction (Layer
Summary: Linguistics Layer). Contains language structure only (Rule 18).

Repository layout follows Architectural Layer -> artefact purpose:
data/ (LinguisticsLayer, the Word/Clause/Sentence/Paragraph/Subject/
UserPrompt tree, LinguisticSystemPropertyTensor), agents/
(LinguisticsAgent base -- no concrete subclasses yet), role/
(GraphProcessor, PromptTokenizer, LinguisticLexer,
ClauseSegmentationUtility -- Linguistics doesn't use the *Agent-subclass
convention the other three layers use, since this processing doesn't
decompose cleanly into that shape, but every one of these classes still
plays an active role rather than just holding state), documentation/,
api/, ui/, assets/.

The lexicon (Dictionary, DictionaryEntry) and everything that
seeds/looks up/hydrates it (DictionaryProcessor, AsyncDictionaryHydrator,
ExternalDictionaryAdapter) live in the Vocabulary Layer, not here --
GraphProcessor takes a lira.vocabulary DictionaryProcessor to resolve
tokens (Rule 17: Vocabulary contains lexical inventory only)."""

from .role.clause_segmentation import ClauseSegmentationUtility
from .role.graph_processor import GraphProcessor
from .role.lexer import LinguisticLexer
from .role.prompt_tokenizer import PromptTokenizer
from .data.grammar_configuration import LinguisticGrammarConfiguration
from .data.layer import LinguisticsLayer
from .data.system_property import LinguisticSystemProperty, SystemPropertyRef
from .data.tensor import LinguisticSystemPropertyTensor
from .data.clause import Clause
from .data.linguistic_relation_type import LinguisticRelationType
from .data.linguistic_unit import LinguisticUnit
from .data.linguistic_unit_kind import LinguisticUnitKind
from .data.paragraph import Paragraph
from .data.part_of_speech import PartOfSpeech
from .data.punctuation import Punctuation
from .data.sentence import Sentence
from .data.subject import Subject
from .data.user_prompt import UserPrompt
from .data.word import Word

__all__ = [
    "LinguisticsLayer",
    "LinguisticGrammarConfiguration",
    "LinguisticLexer",
    "ClauseSegmentationUtility",
    "GraphProcessor",
    "PromptTokenizer",
    "SystemPropertyRef",
    "LinguisticSystemProperty",
    "LinguisticSystemPropertyTensor",
    "LinguisticUnitKind",
    "PartOfSpeech",
    "LinguisticRelationType",
    "LinguisticUnit",
    "UserPrompt",
    "Word",
    "Punctuation",
    "Clause",
    "Sentence",
    "Paragraph",
    "Subject",
]
