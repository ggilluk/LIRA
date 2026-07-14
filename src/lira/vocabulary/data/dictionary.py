"""Thread-safe lexicon storage layer."""

import threading
from typing import List, Optional

from .dictionary_entry import DictionaryEntry


class Dictionary:
    """Thread-safe lexicon configuration storage mapping shared operational memory space."""

    def __init__(self):
        self.entries: List[DictionaryEntry] = []
        self._lock = threading.Lock()

    def lookup(self, text: str) -> Optional[DictionaryEntry]:
        with self._lock:
            for entry in self.entries:
                if entry.unit.text.lower() == text.lower():
                    return entry
            return None

    def append(self, entry: DictionaryEntry) -> None:
        with self._lock:
            self.entries.append(entry)

    def total_entries(self) -> int:
        with self._lock:
            return len(self.entries)
