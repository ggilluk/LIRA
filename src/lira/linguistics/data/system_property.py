"""Bridge metadata attached to every linguistic unit. LinguisticSystemProperty
is a VIEW, not a value holder -- by-reference into
LinguisticSystemPropertyTensor (Rule 14), same discipline as
SystemPropertyRef in the Knowledge Layer: reading .sequence_confidence
reads the live tensor cell; writing it writes the live cell, immediately
visible to every other reference to that same row.

SystemPropertyRef (below) is a placeholder for a reference to a native
graph or tensor engine node (e.g. a concept in the Knowledge Layer's
graph) -- not wired up yet."""

from typing import Optional

from .tensor import (
    ACTIVATION_COL,
    AROUSAL_COL,
    CONFIDENCE_COL,
    DOMINANCE_COL,
    INFERENCE_DEPTH_COL,
    PROVENANCE_COL,
    SEQUENCE_COL,
    TEMPORAL_COL,
    VALENCE_COL,
    LinguisticSystemPropertyTensor,
)
from .units import LinguisticUnitKind


class SystemPropertyRef:
    """Placeholder representing a reference to a native graph or tensor engine node."""
    pass


class LinguisticSystemProperty:
    __slots__ = ("store", "row")

    def __init__(self, store: LinguisticSystemPropertyTensor, row: int):
        self.store = store
        self.row = row

    @property
    def kind(self) -> LinguisticUnitKind:
        return self.store.kind_of(self.row)

    @property
    def sequence_number(self) -> int:
        return int(self.store.values[self.row, SEQUENCE_COL])

    @property
    def linguistic_unit_uuid(self) -> str:
        return self.store.uuid_of(self.row)

    @property
    def linguistic_unit(self):
        return self.store.linguistic_unit_of(self.row)

    @property
    def concept_system_property(self) -> SystemPropertyRef:
        return self.store.concept_system_property_of(self.row)

    @property
    def origin(self) -> Optional[str]:
        return self.store.origin_of(self.row)

    @property
    def sequence_confidence(self) -> float:
        return self.store.values[self.row, CONFIDENCE_COL]

    @sequence_confidence.setter
    def sequence_confidence(self, value: float):
        self.store.values[self.row, CONFIDENCE_COL] = value

    @property
    def sequence_provenance(self) -> float:
        return self.store.values[self.row, PROVENANCE_COL]

    @sequence_provenance.setter
    def sequence_provenance(self, value: float):
        self.store.values[self.row, PROVENANCE_COL] = value

    @property
    def sequence_temporal(self) -> float:
        return self.store.values[self.row, TEMPORAL_COL]

    @sequence_temporal.setter
    def sequence_temporal(self, value: float):
        self.store.values[self.row, TEMPORAL_COL] = value

    @property
    def sequence_activation(self) -> float:
        return self.store.values[self.row, ACTIVATION_COL]

    @sequence_activation.setter
    def sequence_activation(self, value: float):
        self.store.values[self.row, ACTIVATION_COL] = value

    @property
    def inference_depth(self) -> int:
        return int(self.store.values[self.row, INFERENCE_DEPTH_COL])

    @inference_depth.setter
    def inference_depth(self, value: int):
        self.store.values[self.row, INFERENCE_DEPTH_COL] = value

    @property
    def valence_weight(self) -> float:
        return self.store.values[self.row, VALENCE_COL]

    @valence_weight.setter
    def valence_weight(self, value: float):
        self.store.values[self.row, VALENCE_COL] = value

    @property
    def arousal_weight(self) -> float:
        return self.store.values[self.row, AROUSAL_COL]

    @arousal_weight.setter
    def arousal_weight(self, value: float):
        self.store.values[self.row, AROUSAL_COL] = value

    @property
    def dominance_weight(self) -> float:
        return self.store.values[self.row, DOMINANCE_COL]

    @dominance_weight.setter
    def dominance_weight(self, value: float):
        self.store.values[self.row, DOMINANCE_COL] = value
