"""Thread-safe lexicon storage layer: the top-level container
aggregating Word records for a language (Vocabulary Layer developer
specification, 3)."""

import threading
from typing import List, Optional

from .word import Word


class Dictionary:
    """Thread-safe lexicon configuration storage mapping shared operational memory space."""

    def __init__(self):
        self.words: List[Word] = []
        self._lock = threading.Lock()

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

    def append(self, word: Word) -> None:
        with self._lock:
            self.words.append(word)

    def total_entries(self) -> int:
        with self._lock:
            return len(self.words)
