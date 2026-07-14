"""Thread-safe LexicalRelationship storage layer, mirroring Dictionary's
storage discipline."""

import threading
from typing import List, Tuple

from .lexical_relationship import LexicalRelationship


class LexicalRelationshipStore:
    def __init__(self):
        self.relationships: List[LexicalRelationship] = []
        self._lock = threading.Lock()

    def add(self, relationship: LexicalRelationship) -> None:
        with self._lock:
            self.relationships.append(relationship)

    def outgoing(self, source_word_id: str) -> Tuple[LexicalRelationship, ...]:
        with self._lock:
            return tuple(r for r in self.relationships if r.source_word_id.value == source_word_id)

    def incoming(self, target_word_id: str) -> Tuple[LexicalRelationship, ...]:
        with self._lock:
            return tuple(r for r in self.relationships if r.target_word_id.value == target_word_id)

    def total_relationships(self) -> int:
        with self._lock:
            return len(self.relationships)
