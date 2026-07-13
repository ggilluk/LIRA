"""Linguistics Layer: grammar/syntax-level processing (parsing,
morphology) that feeds concept and relationship extraction (Layer
Summary: Linguistics Layer). Contains language structure only (Rule 18).

Repository layout follows Architectural Layer -> artefact purpose:
data_classes/ (LinguisticsLayer, the Word/Clause/Sentence/Paragraph/
Subject/UserPrompt tree, LinguisticSystemPropertyTensor, Dictionary),
agents_role/ (GraphProcessor, PromptTokenizer, LinguisticLexer,
ClauseSegmentationUtility, DictionaryProcessor, AsyncDictionaryHydrator,
ExternalDictionaryAdapter -- Linguistics doesn't use the *Agent-subclass
convention the other three layers use, since this processing doesn't
decompose cleanly into that shape, but every one of these classes still
plays an active role rather than just holding state), documentation/,
apis/, uis/, assets/."""

from .agents_role.clause_segmentation import ClauseSegmentationUtility
from .agents_role.dictionary_hydrator import AsyncDictionaryHydrator
from .agents_role.dictionary_processor import DictionaryProcessor
from .agents_role.external_dictionary_adapter import ExternalDictionaryAdapter
from .agents_role.graph_processor import GraphProcessor
from .agents_role.lexer import LinguisticLexer
from .agents_role.prompt_tokenizer import PromptTokenizer
from .data_classes.dictionary import Dictionary, DictionaryEntry
from .data_classes.grammar_configuration import LinguisticGrammarConfiguration
from .data_classes.layer import LinguisticsLayer
from .data_classes.system_property import LinguisticSystemProperty, SystemPropertyRef
from .data_classes.tensor import LinguisticSystemPropertyTensor
from .data_classes.units import (
    Clause,
    LinguisticRelationType,
    LinguisticUnit,
    LinguisticUnitKind,
    Paragraph,
    PartOfSpeech,
    Punctuation,
    Sentence,
    Subject,
    UserPrompt,
    Word,
)

__all__ = [
    "LinguisticsLayer",
    "LinguisticGrammarConfiguration",
    "Dictionary",
    "DictionaryEntry",
    "AsyncDictionaryHydrator",
    "DictionaryProcessor",
    "ExternalDictionaryAdapter",
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
