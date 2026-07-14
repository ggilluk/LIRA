"""Looks up or creates DictionaryEntry records, queuing background
hydration for unknown words."""

from ..data.dictionary import Dictionary
from ..data.dictionary_entry import DictionaryEntry
from ..data.part_of_speech import PartOfSpeech
from ..data.punctuation import Punctuation
from ..data.word import Word
from .dictionary_hydrator import AsyncDictionaryHydrator
from lira.value_objects import Text


class DictionaryProcessor:
    def __init__(self, dictionary: Dictionary, hydrator: AsyncDictionaryHydrator):
        self.dictionary = dictionary
        self.hydrator = hydrator

    def get_or_create_entry(self, raw_token_text: str) -> DictionaryEntry:
        lookup_str = raw_token_text.lower().strip()
        lex_match = self.dictionary.lookup(lookup_str)

        if lex_match:
            return lex_match

        if lookup_str in [".", "!", "?", ";", ","]:
            entry = DictionaryEntry(
                unit=Punctuation(text=lookup_str, symbol=lookup_str),
                meaning=Text(value="Punctuation boundary indicator."), parts_of_speech=[]
            )
            self.dictionary.append(entry)
            return entry

        fallback_word = Word(text=lookup_str, part_of_speech=PartOfSpeech.Noun)
        entry = DictionaryEntry(
            unit=fallback_word,
            meaning=Text(value="Pending async network execution resolution structural tracking..."),
            parts_of_speech=[PartOfSpeech.Noun], is_fully_hydrated=False
        )
        self.dictionary.append(entry)
        self.hydrator.queue_hydration(lookup_str)
        return entry
