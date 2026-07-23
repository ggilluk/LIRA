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
        matches = self.lookup_all(text)
        return matches[0] if matches else None

    def lookup_all(self, text: str) -> Tuple[Word, ...]:
        """Returns every Word whose surface text matches `text`
        (case-insensitive) -- every homograph, not just the first. A
        word with more than one legitimate part of speech (e.g. "run"
        as NOUN vs VERB), or more than one meaning under the exact same
        (text, part_of_speech) (a word-sense conflict, 9.2), is modelled
        as multiple Word entries (4.1: "one lexical form in one language
        and one grammatical category"), each sharing the same unmodified
        `text` and `lexical_form` but each with its own `entry_id` --
        lookup() only ever surfaced the first such entry; this is how
        the rest become visible too."""
        with self._lock:
            return tuple(word for word in self.words if word.text.lower() == text.lower())

    def find_by_uuid(self, word_id: str) -> Optional[Word]:
        with self._lock:
            for word in self.words:
                if word.uuid.value == word_id:
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
        original otherwise, which would give two different Domains'
        copies of "be" the identical per-Domain-graph identity. `entry_id`
        is deliberately left untouched by the shallow copy: it's the
        stable Qualified Word Identity (Word 4.2's `entry_id` field
        docstring), the same underlying Common Vocabulary Cache entry
        regardless of how many Domains hold their own runtime copy of
        it, so every Domain's copy of "be" shares one `entry_id` even
        though each has its own distinct `uuid`."""
        with other._lock:
            copied = []
            for word in other.words:
                new_word = copy.copy(word)
                new_word.uuid = Identifier(value=str(uuid_module.uuid4()))
                copied.append(new_word)
        with self._lock:
            self.words.extend(copied)
