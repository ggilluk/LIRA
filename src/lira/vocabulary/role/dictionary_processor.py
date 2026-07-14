"""Looks up or creates Word records, queuing background hydration for
unknown words. Also resolves punctuation tokens, which live outside the
Dictionary entirely (Vocabulary Layer developer specification, 3 --
Dictionary aggregates Word records only)."""

from typing import Union

from lira.value_objects import Text

from ..data.dictionary import Dictionary
from ..data.part_of_speech import PartOfSpeech
from ..data.punctuation import Punctuation
from ..data.word import Word
from .dictionary_hydrator import AsyncDictionaryHydrator

PUNCTUATION_SYMBOLS = (".", "!", "?", ";", ",")


class DictionaryProcessor:
    def __init__(self, dictionary: Dictionary, hydrator: AsyncDictionaryHydrator):
        self.dictionary = dictionary
        self.hydrator = hydrator

    def get_or_create_word(self, raw_token_text: str) -> Union[Word, Punctuation]:
        lookup_str = raw_token_text.lower().strip()

        if lookup_str in PUNCTUATION_SYMBOLS:
            return Punctuation(text=lookup_str, symbol=lookup_str)

        existing = self.dictionary.lookup(lookup_str)
        if existing:
            return existing

        fallback_word = Word(
            text=lookup_str, part_of_speech=PartOfSpeech.NOUN,
            definition=Text(value="Pending async network execution resolution structural tracking..."),
            is_fully_hydrated=False,
        )
        self.dictionary.append(fallback_word)
        self.hydrator.queue_hydration(lookup_str)
        return fallback_word
