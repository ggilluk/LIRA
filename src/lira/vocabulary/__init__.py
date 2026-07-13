"""Vocabulary Layer: term/lexeme-level concept identity within a Domain
(surface-form to concept resolution). Contains lexical inventory only
(Rule 17).

Repository layout follows Architectural Layer -> artefact purpose:
data/ (VocabularyLayer, Dictionary, DictionaryEntry), agents/
(VocabularyAgent and concrete agents), role/ (DictionaryProcessor,
AsyncDictionaryHydrator, ExternalDictionaryAdapter -- the lexicon and
everything that seeds/looks up/hydrates it belong here, not
Linguistics), documentation/, api/, ui/, assets/."""

from .agents import VocabularyAgent
from .role.dictionary_hydrator import AsyncDictionaryHydrator
from .role.dictionary_processor import DictionaryProcessor
from .role.external_dictionary_adapter import ExternalDictionaryAdapter
from .data.dictionary import Dictionary, DictionaryEntry
from .data.layer import VocabularyLayer

__all__ = [
    "VocabularyLayer",
    "VocabularyAgent",
    "Dictionary",
    "DictionaryEntry",
    "AsyncDictionaryHydrator",
    "DictionaryProcessor",
    "ExternalDictionaryAdapter",
]
