"""Vocabulary Layer: term/lexeme-level concept identity within a Domain
(surface-form to concept resolution). Contains lexical inventory only
(Rule 17).

Repository layout follows Architectural Layer -> artefact purpose:
data_classes/ (VocabularyLayer, Dictionary, DictionaryEntry),
agents_role/ (VocabularyAgent and concrete agents, DictionaryProcessor,
AsyncDictionaryHydrator, ExternalDictionaryAdapter -- the lexicon and
everything that seeds/looks up/hydrates it belong here, not Linguistics),
documentation/, apis/, uis/, assets/."""

from .agents_role import VocabularyAgent
from .agents_role.dictionary_hydrator import AsyncDictionaryHydrator
from .agents_role.dictionary_processor import DictionaryProcessor
from .agents_role.external_dictionary_adapter import ExternalDictionaryAdapter
from .data_classes.dictionary import Dictionary, DictionaryEntry
from .data_classes.layer import VocabularyLayer

__all__ = [
    "VocabularyLayer",
    "VocabularyAgent",
    "Dictionary",
    "DictionaryEntry",
    "AsyncDictionaryHydrator",
    "DictionaryProcessor",
    "ExternalDictionaryAdapter",
]
