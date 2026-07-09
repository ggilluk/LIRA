"""Linguistics Layer tensor store: one row per linguistic unit (Word,
Clause, Sentence, Paragraph, Subject). Grown by doubling like
TensorLiraGraph's dense matrices -- amortized O(1) per allocation, not a
fixed capacity that silently overflows. UUIDs live in a plain Python
list, not lossily hashed into a tensor cell -- identity is never derived
from truncated hashes, matching TensorLiraGraph's _edge_uuid convention."""

import uuid as uuid_mod

import numpy as np

from .units import LinguisticUnitKind

KIND_COL, SEQUENCE_COL = 0, 1
N_COLS = 2


class LinguisticSystemPropertyTensor:
    def __init__(self, initial_capacity: int = 16):
        self._capacity = initial_capacity
        self._n_rows = 0
        self.values = np.zeros((self._capacity, N_COLS), dtype=np.float64)
        self._uuids = []

    def _grow(self):
        new_capacity = self._capacity * 2
        new_values = np.zeros((new_capacity, N_COLS), dtype=self.values.dtype)
        new_values[:self._n_rows] = self.values[:self._n_rows]
        self.values = new_values
        self._capacity = new_capacity

    def allocate_row(self, kind: LinguisticUnitKind, sequence_number: int) -> int:
        if self._n_rows >= self._capacity:
            self._grow()
        row = self._n_rows
        self._n_rows += 1
        self.values[row, KIND_COL] = kind.value
        self.values[row, SEQUENCE_COL] = sequence_number
        self._uuids.append(str(uuid_mod.uuid4()))
        return row

    def uuid_of(self, row: int) -> str:
        return self._uuids[row]
