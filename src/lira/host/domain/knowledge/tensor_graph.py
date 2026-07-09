"""
Tensor-native LiraGraph: the dense (ISA, confidence, combined-weight)
matrices are the PERSISTENT, CANONICAL storage -- not a snapshot rebuilt
from an object graph. They exist continuously and are updated incrementally,
in O(1), every time a relationship is added. SystemProperty's numeric
fields are views (graph reference + row/col index) into these tensors,
not copied Python floats -- reading .confidence reads the live tensor
cell; writing to it (e.g. from backprop) writes the live tensor cell,
immediately visible to every other reference to that same edge.

This is the actual fix for the bottleneck found in the previous version:
that version rebuilt the dense matrices from scratch (an O(E) or worse
scan) on every single call to find_missing_attributes_tensor. Here,
"building" never happens -- the matrices are always already up to date,
because every add_relationship call updates them directly.
"""
import numpy as np
from enum import Enum
from typing import NamedTuple


class ValueTypeKind(Enum):
    Measure = "Measure"
    Quantity = "Quantity"
    Amount = "Amount"
    Code = "Code"
    Identifier = "Identifier"
    Text = "Text"
    DateTimeValue = "DateTimeValue"
    Indicator = "Indicator"


class ConceptKind(Enum):
    Noun = "Noun"
    Relationship = "Relationship"
    Attribute = "Attribute"


class FactOrigin(Enum):
    Taught = 0
    Observed = 1
    Inferred = 2


class Band(Enum):
    AttributeRelationshipCompletion = 1
    GeneralisationDiscovery = 2
    Compartmentalisation = 3
    CrossDomainGeneralisation = 4
    OutputAttributeRelationshipCompletion = 5


BASE_PROVENANCE = 0.85


def provenance_for_depth(depth: int) -> float:
    if depth < 1:
        depth = 1
    return min(0.9999, 1 - (1 - BASE_PROVENANCE) / (depth ** 2))


class ConceptRef(NamedTuple):
    """A concept is just an index into the graph's concept tables --
    lightweight, no copied data."""
    graph: "TensorLiraGraph"
    idx: int

    @property
    def uuid(self):
        return self.graph._concept_uuids[self.idx]

    @property
    def name(self):
        return self.graph._concept_names[self.idx]

    @property
    def kind(self):
        return self.graph._concept_kinds[self.idx]

    @property
    def primitive_value(self):
        return self.graph._concept_values[self.idx]

    @property
    def unit_or_code(self):
        return self.graph._concept_units[self.idx]

    @property
    def value_type(self):
        return self.graph._concept_value_types[self.idx]


class SystemPropertyRef:
    """A VIEW, not a value holder. Every property reads/writes a specific
    cell of the graph's persistent tensors, by (row, col) reference.
    This is the by-reference design: two different Python objects
    pointing at the same (row, col) always see the same live value,
    because there is only ever one underlying float, in the tensor."""

    __slots__ = ("graph", "row", "col")

    def __init__(self, graph, row, col):
        self.graph = graph
        self.row = row
        self.col = col

    @property
    def confidence(self):
        return self.graph._M_confidence[self.row, self.col]

    @confidence.setter
    def confidence(self, value):
        self.graph._M_confidence[self.row, self.col] = value

    @property
    def provenance(self):
        return self.graph._M_provenance[self.row, self.col]

    @provenance.setter
    def provenance(self, value):
        self.graph._M_provenance[self.row, self.col] = value

    @property
    def temporal(self):
        return self.graph._M_temporal[self.row, self.col]

    @temporal.setter
    def temporal(self, value):
        self.graph._M_temporal[self.row, self.col] = value

    @property
    def activation(self):
        return self.graph._M_activation[self.row, self.col]

    @activation.setter
    def activation(self, value):
        self.graph._M_activation[self.row, self.col] = value

    @property
    def combined_weight(self):
        return (self.confidence * self.provenance * self.temporal * self.activation)

    @property
    def inference_depth(self):
        return int(self.graph._M_inference_depth[self.row, self.col])

    @property
    def origin(self):
        return FactOrigin(int(self.graph._M_origin[self.row, self.col]))

    @property
    def uuid(self):
        return self.graph._edge_uuid.get((self.row, self.col))


class RelationshipRef(NamedTuple):
    graph: "TensorLiraGraph"
    source_idx: int
    verb_col: int  # encodes BOTH verb and dest via the column key space

    @property
    def source(self):
        return ConceptRef(self.graph, self.source_idx)

    @property
    def sp(self):
        return SystemPropertyRef(self.graph, self.source_idx, self.verb_col)

    @property
    def relationship_uuid(self):
        return self.graph._col_verb_uuid[self.verb_col]

    @property
    def destination_key(self):
        return self.graph._col_dest_key[self.verb_col]


class TensorLiraGraph:
    """
    Dense matrices are allocated with SPARE CAPACITY and grown by doubling
    (the same amortized-O(1)-append trick CPython lists use internally),
    so adding a concept or a new (verb, dest) column almost never requires
    a full reallocation -- only occasionally, and the cost amortizes to
    O(1) per addition, not O(E) every call.
    """

    def __init__(self, initial_capacity=16):
        self._concept_uuids = []
        self._concept_names = []
        self._concept_kinds = []
        self._concept_values = []
        self._concept_units = []
        self._concept_value_types = []
        self._concept_uuid_to_idx = {}
        self._name_kind_to_idx = {}  # O(1) dedup lookup -- the fix for the bug found via benchmarking

        self._col_key_to_idx = {}   # (verb_uuid, dest_key) -> column index
        self._col_verb_uuid = []
        self._col_dest_key = []

        self._capacity_rows = initial_capacity
        self._capacity_cols = initial_capacity
        self._n_rows = 0
        self._n_cols = 0

        self._M_confidence = np.zeros((self._capacity_rows, self._capacity_cols))
        self._M_provenance = np.zeros((self._capacity_rows, self._capacity_cols))
        self._M_temporal = np.zeros((self._capacity_rows, self._capacity_cols))
        self._M_activation = np.zeros((self._capacity_rows, self._capacity_cols))
        self._M_inference_depth = np.zeros((self._capacity_rows, self._capacity_cols), dtype=int)
        self._M_origin = np.zeros((self._capacity_rows, self._capacity_cols), dtype=int)
        self._M_band = np.zeros((self._capacity_rows, self._capacity_cols), dtype=int)  # which Band produced this cell

        self._edge_uuid = {}  # (row, col) -> uuid string, for identity/backprop lookups
        self._parent_of = []   # sparse: child_idx -> parent_idx (-1 = none), replaces dense ISA matrix
        self._parent_col = []  # child_idx -> which column holds its own is-a edge (for lineage)
        self._lineage = {}     # (row, col) -> list of ((parent_row, parent_col), local_partial_derivative)
        self._cell_specific_value = {}  # (row, col) -> (primitive_value, unit) for TAUGHT/OBSERVED cells
                                          # only -- an inferred/lifted cell correctly has no specific value,
                                          # since it represents "has SOME instance of this type", not a
                                          # fabricated number. Needed because columns are normalized to
                                          # attribute TYPE (so Band 1/3's math works), which means a bare
                                          # (row, col) cell alone can't recover which specific value a
                                          # taught fact originally pointed at.
                                # -- inherently sparse/ragged, doesn't tensorize; lives beside the dense
                                # tensors, referencing them by (row, col) rather than duplicating anything.
        import uuid as _uuid_mod
        self._uuid_mod = _uuid_mod

    # -- growth (amortized O(1), the actual fix for the earlier bottleneck) --

    def _grow_rows(self):
        new_capacity = self._capacity_rows * 2
        for attr in ("_M_confidence", "_M_provenance", "_M_temporal",
                     "_M_activation", "_M_inference_depth", "_M_origin", "_M_band"):
            old = getattr(self, attr)
            new = np.zeros((new_capacity, self._capacity_cols), dtype=old.dtype)
            new[:self._n_rows, :self._n_cols] = old[:self._n_rows, :self._n_cols]
            setattr(self, attr, new)
        self._capacity_rows = new_capacity

    def _grow_cols(self):
        new_capacity = self._capacity_cols * 2
        for attr in ("_M_confidence", "_M_provenance", "_M_temporal",
                     "_M_activation", "_M_inference_depth", "_M_origin", "_M_band"):
            old = getattr(self, attr)
            new = np.zeros((self._capacity_rows, new_capacity), dtype=old.dtype)
            new[:self._n_rows, :self._n_cols] = old[:self._n_rows, :self._n_cols]
            setattr(self, attr, new)
        self._capacity_cols = new_capacity

    # -- concept / relationship creation --

    def add_concept(self, name, kind, primitive_value=None, unit_or_code="", value_type=ValueTypeKind.Text):
        # For Attribute-kind concepts, dedup by (name, kind, value, unit) --
        # NOT name+kind alone, which would silently collapse distinct
        # measurements (Model A's 220 Ohm vs Model B's 330 Ohm) into one
        # concept.
        if kind == ConceptKind.Attribute:
            dedup_key = (name, kind, primitive_value, unit_or_code)
        else:
            dedup_key = (name, kind)
        if dedup_key in self._name_kind_to_idx:
            return ConceptRef(self, self._name_kind_to_idx[dedup_key])

        if self._n_rows >= self._capacity_rows:
            self._grow_rows()

        idx = self._n_rows
        self._n_rows += 1
        self._concept_uuids.append(str(self._uuid_mod.uuid4()))
        self._concept_names.append(name)
        self._concept_kinds.append(kind)
        self._concept_values.append(primitive_value)
        self._concept_units.append(unit_or_code)
        self._concept_value_types.append(value_type)
        self._concept_uuid_to_idx[self._concept_uuids[-1]] = idx
        self._name_kind_to_idx[dedup_key] = idx
        return ConceptRef(self, idx)

    def add_attribute_concept(self, name, primitive_value, unit_or_code="", value_type=ValueTypeKind.Text):
        return self.add_concept(name, ConceptKind.Attribute, primitive_value, unit_or_code, value_type)

    def _dest_key_for(self, destination: ConceptRef):
        if destination.kind == ConceptKind.Attribute:
            return ("attr", destination.name)
        return destination.idx

    def _get_or_create_column(self, verb: ConceptRef, dest_key):
        key = (verb.uuid, dest_key)
        if key in self._col_key_to_idx:
            return self._col_key_to_idx[key]
        if self._n_cols >= self._capacity_cols:
            self._grow_cols()
        col = self._n_cols
        self._n_cols += 1
        self._col_key_to_idx[key] = col
        self._col_verb_uuid.append(verb.uuid)
        self._col_dest_key.append(dest_key)
        return col

    def add_relationship(self, source: ConceptRef, relationship: ConceptRef, destination: ConceptRef,
                          confidence, provenance, temporal, activation,
                          inference_depth=0, origin=FactOrigin.Taught, isA_uuid=None,
                          band=Band.AttributeRelationshipCompletion):
        """O(1) amortized: writes directly into the persistent matrices.
        No rebuild, no scan -- this IS the storage, updated in place.

        If this edge IS an is-a edge (isA_uuid matches), also updates the
        persistent SPARSE parent-index array -- O(1), not the O(C^2) dense
        matrix this replaced. Assumes single inheritance (a tree).
        """
        if source.kind == ConceptKind.Attribute:
            raise ValueError(f"'{source.name}' is Attribute-kind and cannot be a relationship source.")

        dest_key = self._dest_key_for(destination)
        col = self._get_or_create_column(relationship, dest_key)
        row = source.idx

        self._M_confidence[row, col] = confidence
        self._M_provenance[row, col] = provenance
        self._M_temporal[row, col] = temporal
        self._M_activation[row, col] = activation
        self._M_inference_depth[row, col] = inference_depth
        self._M_origin[row, col] = origin.value
        self._M_band[row, col] = band.value
        self._edge_uuid[(row, col)] = str(self._uuid_mod.uuid4())

        if (origin != FactOrigin.Inferred and destination.kind == ConceptKind.Attribute
                and destination.primitive_value is not None):
            self._cell_specific_value[(row, col)] = (destination.primitive_value, destination.unit_or_code)

        if isA_uuid is not None and relationship.uuid == isA_uuid and isinstance(dest_key, int):
            if row >= len(self._parent_of):
                pad = row - len(self._parent_of) + 1
                self._parent_of.extend([-1] * pad)
                self._parent_col.extend([0] * pad)
            self._parent_of[row] = dest_key
            self._parent_col[row] = col

        return RelationshipRef(self, row, col)

    def find_missing_attributes(self, isA: ConceptRef, threshold: float):
        """PURE QUERY against the ALREADY-CURRENT persistent matrices --
        no snapshot, no dense (C,C) matrix rebuild. Uses the sparse
        parent_of array (fancy indexing) instead of a full ISA matmul,
        which is the fix for the O(C^2) bottleneck: a dense is-a matrix
        wastes O(C^2) space/time representing what is, in every example
        so far, a tree (one parent per child).
        """
        C, D = self._n_rows, self._n_cols
        conf = self._M_confidence[:C, :D]
        combined = conf * self._M_provenance[:C, :D] * self._M_temporal[:C, :D] * self._M_activation[:C, :D]

        parent_of = np.array((self._parent_of + [-1] * (C - len(self._parent_of)))[:C])
        has_parent = parent_of >= 0

        # For each child with a parent, gather the parent's row via fancy
        # indexing -- O(C x D), not O(C^2).
        safe_parent_of = np.where(has_parent, parent_of, 0)
        parent_conf = conf[safe_parent_of, :]          # (C, D): each row is that child's parent's confidence row
        parent_combined = combined[safe_parent_of, :]  # (C, D): same, combined weight

        # child_parent_weight: the child's OWN is-a edge combined weight
        parent_col_arr = np.array((self._parent_col + [0] * (C - len(self._parent_col)))[:C])
        child_parent_weight = combined[np.arange(C), np.where(has_parent, parent_col_arr, 0)]
        child_parent_weight = np.where(has_parent, child_parent_weight, 0.0)

        eligible = (parent_combined >= threshold) & has_parent[:, None]
        missing_mask = (conf == 0) & eligible

        found = []
        rows, cols = np.nonzero(missing_mask)
        for child_idx, col_idx in zip(rows, cols):
            parent_idx = int(parent_of[child_idx])
            found.append((int(child_idx), parent_idx, int(col_idx)))
        return found

    def add_completed_attributes(self, isA: ConceptRef, missing: list, log, band=Band.AttributeRelationshipCompletion):
        """MUTATION -- writes new cells directly into the persistent
        matrices. Still O(1) per completion, same as any other
        add_relationship call, because it IS one. Also records lineage:
        exact analytic partial derivatives at this operating point.

        band is parameterized (not hardcoded) so Band 5 can call this
        exact function with band=Band.OutputAttributeRelationshipCompletion
        instead of silently inheriting Band 1's stamps.
        """
        added = []
        for child_idx, parent_idx, col_idx in missing:
            isa_col = self._isa_col(isA, parent_idx)
            conf_A = self._M_confidence[child_idx, isa_col]
            prov_A = self._M_provenance[child_idx, isa_col]
            temp_A = self._M_temporal[child_idx, isa_col]
            act_A = self._M_activation[child_idx, isa_col]
            child_parent_combined = conf_A * prov_A * temp_A * act_A

            parent_confidence = self._M_confidence[parent_idx, col_idx]
            inferred = child_parent_combined * parent_confidence

            parent_depth = self._M_inference_depth[parent_idx, col_idx]
            child_to_parent_depth = self._M_inference_depth[child_idx, isa_col]
            new_depth = max(child_to_parent_depth, parent_depth) + 1
            provenance = provenance_for_depth(new_depth)

            d_wrt_A = parent_confidence * (prov_A * temp_A * act_A)
            d_wrt_B = child_parent_combined

            self._M_confidence[child_idx, col_idx] = inferred
            self._M_provenance[child_idx, col_idx] = provenance
            self._M_temporal[child_idx, col_idx] = self._M_temporal[parent_idx, col_idx]
            self._M_activation[child_idx, col_idx] = 0.9999
            self._M_inference_depth[child_idx, col_idx] = new_depth
            self._M_origin[child_idx, col_idx] = FactOrigin.Inferred.value
            self._M_band[child_idx, col_idx] = band.value
            self._edge_uuid[(child_idx, col_idx)] = str(self._uuid_mod.uuid4())
            self._lineage[(child_idx, col_idx)] = [
                ((child_idx, isa_col), d_wrt_A),
                ((parent_idx, col_idx), d_wrt_B),
            ]
            added.append((child_idx, col_idx))

            log(f"  [Band{band.value}] inferred: child_idx={child_idx} col={col_idx} "
                f"= {child_parent_combined:.3f} * {parent_confidence:.3f} = {inferred:.4f} "
                f"(inference_depth={new_depth}, provenance={provenance:.4f})")
        return added

    def band5_complete_output_ontology(self, isA: ConceptRef, threshold: float, log):
        """Band 5: reuses Band 1's find_missing_attributes verbatim (the
        query -- 'what's missing' -- is identical regardless of which
        band completes it), but with its OWN add step, stamped with
        Band 5's genuine band/inference identity rather than silently
        inheriting Band 1's.
        """
        missing = self.find_missing_attributes(isA, threshold)
        return self.add_completed_attributes(
            isA, missing, log, band=Band.OutputAttributeRelationshipCompletion
        )

    def _isa_col(self, isA: ConceptRef, dest_idx: int):
        return self._col_key_to_idx[(isA.uuid, dest_idx)]
