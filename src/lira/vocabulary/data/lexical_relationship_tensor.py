"""LexicalRelationship system-properties tensor store: one growable row
per LexicalRelationship, holding its confidence/provenance/temporal/
activation weights in one dense array, grown by doubling (Rule 14) --
the same discipline as LinguisticSystemPropertyTensor in the
Linguistics Layer. Only LexicalRelationship gets a row here; Dictionary
and Word do not (Design Principle 8: tensor-backed system properties
apply only to word relationships, not to words standing alone).

uuid and version are non-numeric per-row data and live in plain Python
lists alongside the tensor, mirroring LinguisticSystemPropertyTensor's
_uuids/_origins convention -- never packed into the tensor itself."""

import numpy as np

CONFIDENCE_COL = 0
PROVENANCE_COL = 1
TEMPORAL_COL = 2
ACTIVATION_COL = 3
N_COLS = 4


class LexicalRelationshipSystemPropertyTensor:
    def __init__(self, initial_capacity: int = 16):
        self._capacity = initial_capacity
        self._n_rows = 0
        self.values = np.zeros((self._capacity, N_COLS), dtype=np.float64)
        self._uuids = []
        self._versions = []

    def _grow(self):
        new_capacity = self._capacity * 2
        new_values = np.zeros((new_capacity, N_COLS), dtype=self.values.dtype)
        new_values[:self._n_rows] = self.values[:self._n_rows]
        self.values = new_values
        self._capacity = new_capacity

    def allocate_row(self, uuid_str: str, version: str, confidence: float = 0.0,
                      provenance: float = 0.0, temporal: float = 0.0, activation: float = 0.0) -> int:
        if self._n_rows >= self._capacity:
            self._grow()
        row = self._n_rows
        self._n_rows += 1

        self.values[row, CONFIDENCE_COL] = confidence
        self.values[row, PROVENANCE_COL] = provenance
        self.values[row, TEMPORAL_COL] = temporal
        self.values[row, ACTIVATION_COL] = activation

        self._uuids.append(uuid_str)
        self._versions.append(version)
        return row

    def uuid_of(self, row: int) -> str:
        return self._uuids[row]

    def version_of(self, row: int) -> str:
        return self._versions[row]
