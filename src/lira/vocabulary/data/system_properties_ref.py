"""SystemPropertiesRef: a LexicalRelationship's by-reference view into
LexicalRelationshipSystemPropertyTensor (Rule 14) -- reading
.confidence_weight reads the live tensor cell; writing it writes the
live cell, immediately visible to every other reference to that same
row. Only LexicalRelationship carries one of these; Dictionary and
Word do not (Design Principle 8)."""

from .lexical_relationship_tensor import (
    ACTIVATION_COL,
    CONFIDENCE_COL,
    PROVENANCE_COL,
    TEMPORAL_COL,
    LexicalRelationshipSystemPropertyTensor,
)


class SystemPropertiesRef:
    __slots__ = ("store", "row")

    def __init__(self, store: LexicalRelationshipSystemPropertyTensor, row: int):
        self.store = store
        self.row = row

    @property
    def uuid(self) -> str:
        return self.store.uuid_of(self.row)

    @property
    def version(self) -> str:
        return self.store.version_of(self.row)

    @property
    def confidence_weight(self) -> float:
        return self.store.values[self.row, CONFIDENCE_COL]

    @confidence_weight.setter
    def confidence_weight(self, value: float):
        self.store.values[self.row, CONFIDENCE_COL] = value

    @property
    def provenance_weight(self) -> float:
        return self.store.values[self.row, PROVENANCE_COL]

    @provenance_weight.setter
    def provenance_weight(self, value: float):
        self.store.values[self.row, PROVENANCE_COL] = value

    @property
    def temporal_value_weight(self) -> float:
        return self.store.values[self.row, TEMPORAL_COL]

    @temporal_value_weight.setter
    def temporal_value_weight(self, value: float):
        self.store.values[self.row, TEMPORAL_COL] = value

    @property
    def activation_weight(self) -> float:
        return self.store.values[self.row, ACTIVATION_COL]

    @activation_weight.setter
    def activation_weight(self, value: float):
        self.store.values[self.row, ACTIVATION_COL] = value
