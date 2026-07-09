"""LinguisticSystemProperty: a by-reference view into a
LinguisticSystemPropertyTensor row (Rule 14) -- reading kind,
sequence_number or uuid reads the live tensor cell, not a copied value,
same convention as SystemPropertyRef in the Knowledge Layer."""

from .tensor import KIND_COL, SEQUENCE_COL, LinguisticSystemPropertyTensor
from .units import LinguisticUnitKind


class LinguisticSystemProperty:
    __slots__ = ("store", "row")

    def __init__(self, store: LinguisticSystemPropertyTensor, row: int):
        self.store = store
        self.row = row

    @property
    def kind(self) -> LinguisticUnitKind:
        return LinguisticUnitKind(int(self.store.values[self.row, KIND_COL]))

    @property
    def sequence_number(self) -> int:
        return int(self.store.values[self.row, SEQUENCE_COL])

    @property
    def uuid(self) -> str:
        return self.store.uuid_of(self.row)
