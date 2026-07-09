"""Shared base for the Object + SystemProperties + SystemTensor pattern
every root component follows (Consistency principle). SystemProperties
is a VIEW, not a value holder -- a by-reference read/write into its
SystemTensor's named fields (Rule 14), the same by-reference discipline
the Knowledge Layer's SystemPropertyRef uses for edge weights."""

import numpy as np


class NamedTensor:
    """Persistent, canonical store for a fixed set of named scalar
    fields. Subclasses set FIELDS; the values live in one numpy array,
    not scattered Python attributes."""

    FIELDS: tuple = ()

    def __init__(self):
        self._field_index = {name: i for i, name in enumerate(self.FIELDS)}
        self.values = np.zeros(len(self.FIELDS))

    def index_of(self, field: str) -> int:
        return self._field_index[field]


class NamedTensorProperties:
    """By-reference view into a NamedTensor: reading/writing an attribute
    reads/writes the referenced tensor's underlying array directly, so
    there is only ever one copy of the value (Rationale: avoids state
    duplication)."""

    def __init__(self, tensor: NamedTensor):
        object.__setattr__(self, "_tensor", tensor)

    def __getattr__(self, field):
        try:
            idx = self._tensor.index_of(field)
        except KeyError:
            raise AttributeError(field)
        return self._tensor.values[idx]

    def __setattr__(self, field, value):
        try:
            idx = self._tensor.index_of(field)
        except KeyError:
            raise AttributeError(field)
        self._tensor.values[idx] = value
