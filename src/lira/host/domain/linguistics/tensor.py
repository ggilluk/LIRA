"""Linguistics Layer tensor store: one growable row per linguistic unit
(Word, Punctuation, Clause, Sentence, Paragraph, Subject, UserPrompt).
Numeric fields live in one dense array, grown by doubling like
TensorLiraGraph's matrices -- amortized O(1) per allocation -- and
LinguisticSystemProperty reads/writes them by reference (Rule 14), not
as copied Python floats. Non-numeric per-row data (uuid, origin, the
live linguistic_unit backref, the concept_system_property placeholder)
lives in plain Python lists, mirroring TensorLiraGraph's _edge_uuid /
_concept_names convention -- never packed into the tensor itself."""

import numpy as np

from .units import LinguisticUnitKind

KIND_COL = 0
SEQUENCE_COL = 1
CONFIDENCE_COL = 2
PROVENANCE_COL = 3
TEMPORAL_COL = 4
ACTIVATION_COL = 5
INFERENCE_DEPTH_COL = 6
VALENCE_COL = 7
AROUSAL_COL = 8
DOMINANCE_COL = 9
N_COLS = 10

# LinguisticUnitKind's members have string .value ("Word", ...), which can't
# live in a float array -- encode by definition-order index instead, which
# is fixed and deterministic (unlike hash()).
_KIND_ORDER = list(LinguisticUnitKind)
_KIND_TO_CODE = {kind: code for code, kind in enumerate(_KIND_ORDER)}


class LinguisticSystemPropertyTensor:
    def __init__(self, initial_capacity: int = 16):
        self._capacity = initial_capacity
        self._n_rows = 0
        self.values = np.zeros((self._capacity, N_COLS), dtype=np.float64)
        self._uuids = []
        self._origins = []
        self._linguistic_units = []
        self._concept_system_properties = []

    def _grow(self):
        new_capacity = self._capacity * 2
        new_values = np.zeros((new_capacity, N_COLS), dtype=self.values.dtype)
        new_values[:self._n_rows] = self.values[:self._n_rows]
        self.values = new_values
        self._capacity = new_capacity

    def allocate_row(self, kind: LinguisticUnitKind, sequence_number: int, uuid_str: str,
                      linguistic_unit, concept_system_property,
                      confidence: float = 0.0, provenance: float = 0.0,
                      temporal: float = 0.0, activation: float = 0.0,
                      inference_depth: int = 0, origin=None,
                      valence: float = 0.0, arousal: float = 0.0, dominance: float = 0.0) -> int:
        if self._n_rows >= self._capacity:
            self._grow()
        row = self._n_rows
        self._n_rows += 1

        self.values[row, KIND_COL] = _KIND_TO_CODE[kind]
        self.values[row, SEQUENCE_COL] = sequence_number
        self.values[row, CONFIDENCE_COL] = confidence
        self.values[row, PROVENANCE_COL] = provenance
        self.values[row, TEMPORAL_COL] = temporal
        self.values[row, ACTIVATION_COL] = activation
        self.values[row, INFERENCE_DEPTH_COL] = inference_depth
        self.values[row, VALENCE_COL] = valence
        self.values[row, AROUSAL_COL] = arousal
        self.values[row, DOMINANCE_COL] = dominance

        self._uuids.append(uuid_str)
        self._origins.append(origin)
        self._linguistic_units.append(linguistic_unit)
        self._concept_system_properties.append(concept_system_property)
        return row

    def kind_of(self, row: int) -> LinguisticUnitKind:
        return _KIND_ORDER[int(self.values[row, KIND_COL])]

    def uuid_of(self, row: int) -> str:
        return self._uuids[row]

    def origin_of(self, row: int):
        return self._origins[row]

    def linguistic_unit_of(self, row: int):
        return self._linguistic_units[row]

    def concept_system_property_of(self, row: int):
        return self._concept_system_properties[row]
