"""Vocabulary Layer: term/lexeme-level concept identity within a Domain
(surface-form to concept resolution). Contains lexical inventory only
(Rule 17).

Repository layout follows Architectural Layer -> artefact purpose:
data/ (VocabularyLayer; Dictionary, DictionaryEntry, one class per
file; PartOfSpeech -- classifying a word's part of speech is a lexical
attribute, same as its meaning, so it lives here rather than
Linguistics; Word, Punctuation -- the lexical units themselves, moved
from Linguistics for the same reason, each still subclassing
Linguistics's LinguisticUnit base; DictionaryEntry.meaning is a
value_objects Text rather than a plain str), agents/ (VocabularyAgent
and concrete agents), role/ (DictionaryProcessor,
AsyncDictionaryHydrator, ExternalDictionaryAdapter -- the lexicon and
everything that seeds/looks up/hydrates it belong here, not
Linguistics), documentation/, api/, ui/, assets/."""

from .agents import VocabularyAgent
from .role.dictionary_hydrator import AsyncDictionaryHydrator
from .role.dictionary_processor import DictionaryProcessor
from .role.external_dictionary_adapter import ExternalDictionaryAdapter
from .data.dictionary import Dictionary
from .data.dictionary_entry import DictionaryEntry
from .data.layer import VocabularyLayer
from .data.part_of_speech import PartOfSpeech
from .data.punctuation import Punctuation
from .data.word import Word

__all__ = [
    "VocabularyLayer",
    "VocabularyAgent",
    "Dictionary",
    "DictionaryEntry",
    "PartOfSpeech",
    "Word",
    "Punctuation",
    "AsyncDictionaryHydrator",
    "DictionaryProcessor",
    "ExternalDictionaryAdapter",
]
