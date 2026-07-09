"""Linguistics Layer: grammar/syntax-level processing (parsing,
morphology) that feeds concept and relationship extraction (Layer
Summary: Linguistics Layer). Wires together the lexicon (Dictionary +
AsyncDictionaryHydrator), the lexer/clause-segmentation utilities, and
GraphProcessor/PromptTokenizer, which build the Word/Punctuation ->
Clause -> Sentence -> Paragraph -> Subject tree for a UserPrompt."""

from .clause_segmentation import ClauseSegmentationUtility
from .dictionary import Dictionary, DictionaryEntry
from .dictionary_hydrator import AsyncDictionaryHydrator
from .dictionary_processor import DictionaryProcessor
from .external_dictionary_adapter import ExternalDictionaryAdapter
from .grammar_configuration import LinguisticGrammarConfiguration
from .graph_processor import GraphProcessor
from .lexer import LinguisticLexer
from .prompt_tokenizer import PromptTokenizer
from .system_property import LinguisticSystemProperty, SystemPropertyRef
from .units import (
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


class LinguisticsLayer:
    def __init__(self, use_clause_segmentation: bool = True):
        self.grammar_configuration = LinguisticGrammarConfiguration()
        self.dictionary = Dictionary()
        self.hydrator = AsyncDictionaryHydrator(self.dictionary)  # starts a background hydration thread
        self.dictionary_processor = DictionaryProcessor(self.dictionary, self.hydrator)
        self.graph_processor = GraphProcessor(self.dictionary_processor, self.grammar_configuration, use_clause_segmentation)
        self.tokenizer = PromptTokenizer(self.graph_processor)

    def tokenize_prompt(self, prompt: UserPrompt) -> Subject:
        return self.tokenizer.tokenize_prompt(prompt)


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
