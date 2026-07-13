"""Lexicon data structures and thread-safe storage layer."""

import threading
from dataclasses import dataclass, field
from typing import List, Optional, Union

from lira.linguistics.data.units import PartOfSpeech, Punctuation, Word


@dataclass
class DictionaryEntry:
    unit: Union[Word, Punctuation]
    meaning: str
    parts_of_speech: List[PartOfSpeech] = field(default_factory=list)
    is_fully_hydrated: bool = True


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
