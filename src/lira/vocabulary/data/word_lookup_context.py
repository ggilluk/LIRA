"""Describes one raw token occurrence being resolved against the
Dictionary -- surface form, casing, and surrounding-token evidence.
Deliberately separate from Word: this is occurrence metadata about a
single appearance of a lexical form in a document, not an attribute of
the lexical form itself (Word 4.1's "one lexical form in one language
and one grammatical category" record). A WordLookupContext never
becomes part of an authoritative Word; it exists only to rank
candidate senses for this one occurrence (PartOfSpeechIdentifier,
ExternalDictionaryAdapter)."""

from dataclasses import dataclass
from typing import Tuple


@dataclass(frozen=True)
class WordLookupContext:
    raw_text: str
    normalised_text: str
    domain_name: str

    sentence_index: int = 0
    token_index: int = 0
    is_sentence_start: bool = False

    preceding_words: Tuple[str, ...] = ()
    following_words: Tuple[str, ...] = ()

    @property
    def is_title_case(self) -> bool:
        return bool(self.raw_text) and self.raw_text[0].isupper() and self.raw_text[1:].islower()

    @property
    def is_upper_case(self) -> bool:
        letters = "".join(character for character in self.raw_text if character.isalpha())
        return bool(letters) and letters.isupper()

    @property
    def contains_hyphen(self) -> bool:
        return "-" in self.raw_text

    @property
    def contains_digit(self) -> bool:
        return any(character.isdigit() for character in self.raw_text)
