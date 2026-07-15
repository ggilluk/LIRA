"""Thread-safe lexicon storage layer: the top-level container
aggregating Word records for a language (Vocabulary Layer developer
specification, 3)."""

import copy
import threading
import uuid as uuid_module
from typing import List, Optional, Tuple

from lira.value_objects import Identifier

from .word import Word


class Dictionary:
    """Thread-safe lexicon configuration storage mapping shared operational memory space."""

    def __init__(self):
        self.words: List[Word] = []
        self._lock = threading.Lock()

    def all(self) -> Tuple[Word, ...]:
        with self._lock:
            return tuple(self.words)

    def lookup(self, text: str) -> Optional[Word]:
        with self._lock:
            for word in self.words:
                if word.text.lower() == text.lower():
                    return word
            return None

    def find_by_uuid(self, word_id: str) -> Optional[Word]:
        with self._lock:
            for word in self.words:
                if word.uuid.value == word_id:
                    return word
            return None

    def find_by_lexical_form(self, lexical_form: str) -> Optional[Word]:
        with self._lock:
            for word in self.words:
                if word.lexical_form.value.lower() == lexical_form.lower():
                    return word
            return None

    def append(self, word: Word) -> None:
        with self._lock:
            self.words.append(word)

    def total_entries(self) -> int:
        with self._lock:
            return len(self.words)

    def seed_from(self, other: "Dictionary") -> None:
        """Bootstraps this Dictionary with a copy of every Word in
        `other` -- used to seed a newly created Domain's Dictionary from
        the reserved Common Domain's Dictionary. Each Word is
        shallow-copied so the two Domains never share a mutable Word
        instance (independent hydration, independent tensor rows), and
        given a freshly generated uuid -- a shallow copy shares the
        *same* Identifier object (and so the same uuid.value) as the
        original otherwise, which would silently violate Qualified Word
        Identity (Domain + Lexical Form) by giving two different
        Domains' copies of "be" the identical uuid."""
        with other._lock:
            copied = []
            for word in other.words:
                new_word = copy.copy(word)
                new_word.uuid = Identifier(value=str(uuid_module.uuid4()))
                copied.append(new_word)
        with self._lock:
            self.words.extend(copied)

    def next_available_lexical_form(self, base_lexical_form: str) -> str:
        """Returns `base_lexical_form` if no existing Word already uses
        it as its lexical_form, otherwise the next free sense-numbered
        variant ("bank_2", "bank_3", ...) -- the naming half of
        resolving a word-sense conflict by modifying the word's name."""
        if self.find_by_lexical_form(base_lexical_form) is None:
            return base_lexical_form
        sense_number = 2
        while self.find_by_lexical_form(f"{base_lexical_form}_{sense_number}") is not None:
            sense_number += 1
        return f"{base_lexical_form}_{sense_number}"
