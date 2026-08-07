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

Knowledge Vector Space (knowledge/documentation/knowledge_vector_space_specification.md,
sections 6/7/41.1/41.9) Dimensions 1 and 2 -- noun Concept generalisation
and composition -- are implemented here as a *reinterpretation* of this
graph's own existing is-a bookkeeping (Section 41.11's own mapping:
HYPERNYM/HYPONYM -> D1), not a parallel structure: D1's z coordinate is
computed automatically, in the same O(1) amortized add_relationship call
that already threads isA_uuid through for Band 1/3/5 attribute
inheritance, the moment an edge's relationship concept matches isA_uuid.
D2 (composition, HOLONYM/MERONYM -> D2) mirrors this exactly for a
second, independent tree, keyed off a new partOf_uuid parameter -- no
existing behaviour changes for a caller that never passes it.

Both trees use fractional/gap indexing (spec 41.9), not the superseded
global-depth z = 1 - d/N formula: a new child's z is the midpoint
between its parent's z and the closest-to-parent boundary any of that
parent's *other* children have already claimed so far (or
D1_D2_BOTTOM if this is the parent's first child). Each successive
sibling is therefore packed progressively closer to the parent, which
is a deliberate property, not an accident: it leaves each sibling the
*largest* possible remaining span down to Bottom for that sibling's
own descendants, rather than shrinking a shared, ever-narrower band
toward Bottom that later-added siblings would inherit a worse share
of. Sibling order/relative position carries no meaning of its own --
only "parent.z > child.z" is guaranteed, for every child. This means
inserting a new child only ever touches that one new row -- no
existing concept's z is ever recomputed -- at the cost of consuming
representable floating-point headroom after enough successive
siblings under one busy parent; an explicit, rare rebalance is a
documented future op (spec 41.9), not implemented here since nothing
has exercised that limit yet.

Dimensions 3 and 4 -- Relationship/Verb Concept generalisation and
composition/mechanics (spec 8, 9, 41.1, 41.2) -- split the same way
the spec's own Dimension Summary table (2) frames them: D3 is a
per-Concept property, exactly like D1, just for `ConceptKind.Relationship`
concepts (a verb like "kill" is more specific than "harm", regardless
of who's doing the killing) -- so it reuses the *same* is-a bookkeeping
and isA_uuid parameter D1 does, branching only on `source.kind` to
decide which z array gets written (spec 41.5's part-of-speech scoping
falls out of that branch automatically, not as a separate check). D4
is *not* stored per-Concept at all: `Qc` (source composition), `r`
(PAD amplitude) and, ultimately, the Cartesian position they produce
via `theta`, genuinely depend on *which* (source, verb, destination)
edge a verb concept is being used in -- "kill" used from "predator"
and "kill" used from "assassin" have different Qc/r -- so D4 is
computed on demand for a specific `RelationshipRef` (an edge instance,
the same granularity `SystemPropertyRef` already uses for confidence/
provenance/etc.), not cached as a fourth per-Concept array. Only
`theta` (causal/entailment angular position, spec 9.2) and `s`
(operator-function state, spec 9.5) need persistent per-edge storage,
since they can't be recomputed from anything else -- `_M_theta`
mirrors the existing per-edge dense matrices (default NaN, spec 5's
"Incomplete vector state rule": a NaN theta means "not part of any
assigned causal/entailment chain yet", not an error), and
`_edge_operator_state` is a sparse dict beside `_edge_uuid`, since an
operator's state is caller-defined (spec 9.5: "defined independently
by the Relationship execution model", out of this file's scope) and
doesn't tensorize cleanly the way a plain float does.
"""
import math
import numpy as np
from enum import Enum
from typing import List, NamedTuple

# Knowledge Vector Space, section 5: 1.0 is the Root boundary (semantic
# +Infinity), 0.0 is Bottom. A concept with no is-a/part-of parent yet
# stays at D1_D2_ROOT by convention -- not because it's confirmed to be
# a root of the whole hierarchy, but because nothing broader is known
# yet; the first is-a/part-of edge added for it repositions it below
# its new parent, same as every other concept.
D1_D2_ROOT = 1.0
D1_D2_BOTTOM = 0.0

# Section 41.3: identity-distance thresholds are configurable, empirically
# calibrated System Properties, not fixed architectural constants -- these
# are provisional defaults (TensorLiraGraph.__init__ accepts overrides),
# not values calibrated against any real corpus yet.
DEFAULT_EPSILON_MERGE = 0.05
DEFAULT_EPSILON_REVIEW = 0.15


def fractional_midpoint(parent_z: float, gap_bound: float) -> float:
    """Spec 41.9's fractional/gap indexing primitive -- shared by every
    Knowledge Vector Space tree that uses it (D1/D2/D3 below; D5/D6 in
    knowledge/data/hosted_domains.py, at Domain scale rather than
    Concept scale). The new child's z is the midpoint between its
    parent's z and the closest-to-parent boundary already claimed by
    one of the parent's other children (`gap_bound` -- D1_D2_BOTTOM if
    this is the parent's first child), so each successive child packs
    progressively closer to the parent, leaving every child the
    largest possible remaining span toward Bottom for its own
    descendants."""
    return (parent_z + gap_bound) / 2


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

    @property
    def d1_z(self) -> float:
        """Knowledge Vector Space Dimension 1 -- noun Concept
        generalisation (Hypernym -> Hyponym). D1_D2_ROOT until this
        concept's first is-a edge is recorded."""
        return self.graph._concept_d1_z[self.idx]

    @property
    def d2_z(self) -> float:
        """Knowledge Vector Space Dimension 2 -- noun Concept
        composition (Holonym -> Meronym). D1_D2_ROOT until this
        concept's first part-of edge is recorded."""
        return self.graph._concept_d2_z[self.idx]

    @property
    def noun_structural_position(self):
        """N(C) = (D1(C), D2(C)) -- spec section 7.1. Combined identity
        position; neither coordinate alone establishes noun structural
        identity (section 12.1)."""
        return (self.d1_z, self.d2_z)

    @property
    def d3_z(self) -> float:
        """Knowledge Vector Space Dimension 3 -- Relationship/Verb
        Concept generalisation (Hypernym -> Troponym). D1_D2_ROOT until
        this (ConceptKind.Relationship) concept's first is-a edge is
        recorded -- see module docstring's D3/D4 section for why this
        reuses the same is-a bookkeeping D1 does."""
        return self.graph._concept_d3_z[self.idx]

    @property
    def pad(self):
        """This concept's own seeded Pleasure/Arousal/Dominance triple
        (spec 41.2 -- "PAD is authored/seeded on the lexical Word/
        Concept"), (0.0, 0.0, 0.0) until set_pad() is called. A
        Relationship reads PAD from its *source* Concept, never
        assigned to the Relationship/edge itself (module docstring)."""
        idx = self.idx
        return (
            self.graph._concept_pad_pleasure[idx],
            self.graph._concept_pad_arousal[idx],
            self.graph._concept_pad_dominance[idx],
        )


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

    @property
    def relationship_concept(self) -> "ConceptRef":
        """The verb Concept this edge's relationship column is keyed
        by (e.g. the "kill" ConceptRef, distinct from any specific use
        of it) -- spec 3's "Relationship <subclass> Concept": this
        edge instance is one *use* of that Concept, carrying its own
        Dimension 4 (module docstring), while the Concept itself
        carries Dimension 3."""
        return ConceptRef(self.graph, self.graph._concept_uuid_to_idx[self.relationship_uuid])

    @property
    def destination(self):
        """The destination ConceptRef, or None when this edge's
        destination is Attribute-kind (an ("attr", name) key, not a
        Concept another edge could chain through -- spec 4's
        destination Concept only applies to a genuine Concept
        destination)."""
        key = self.destination_key
        if isinstance(key, int):
            return ConceptRef(self.graph, key)
        return None


class TensorLiraGraph:
    """
    Dense matrices are allocated with SPARE CAPACITY and grown by doubling
    (the same amortized-O(1)-append trick CPython lists use internally),
    so adding a concept or a new (verb, dest) column almost never requires
    a full reallocation -- only occasionally, and the cost amortizes to
    O(1) per addition, not O(E) every call.
    """

    def __init__(self, initial_capacity=16, epsilon_merge=DEFAULT_EPSILON_MERGE, epsilon_review=DEFAULT_EPSILON_REVIEW):
        self._concept_uuids = []
        self._concept_names = []
        self._concept_kinds = []
        self._concept_values = []
        self._concept_units = []
        self._concept_value_types = []
        self._concept_uuid_to_idx = {}
        self._name_kind_to_idx = {}  # O(1) dedup lookup -- the fix for the bug found via benchmarking

        # Knowledge Vector Space D1/D2 (module docstring) -- configurable
        # per spec 41.3, not hardcoded.
        self.epsilon_merge = epsilon_merge
        self.epsilon_review = epsilon_review

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
        # Knowledge Vector Space D4's theta (causal/entailment angular
        # position, spec 9.2) -- per edge, like the matrices above; NaN
        # means "not part of any assigned causal/entailment chain yet"
        # (module docstring), not an error.
        self._M_theta = np.full((self._capacity_rows, self._capacity_cols), np.nan)

        self._edge_uuid = {}  # (row, col) -> uuid string, for identity/backprop lookups
        self._parent_of = []   # sparse: child_idx -> parent_idx (-1 = none), replaces dense ISA matrix
        self._parent_col = []  # child_idx -> which column holds its own is-a edge (for lineage)
        self._lineage = {}     # (row, col) -> list of ((parent_row, parent_col), local_partial_derivative)

        # Knowledge Vector Space D1 (generalisation) -- reuses the is-a
        # bookkeeping above; _concept_d1_z holds each concept's own
        # fractional z, _d1_next_gap_bound tracks the closest-to-parent
        # boundary claimed so far per parent (module docstring's
        # gap-indexing scheme -- each new child packs in above that
        # boundary, toward the parent, not toward Bottom).
        self._concept_d1_z = []
        self._d1_next_gap_bound = {}  # parent_idx -> closest-to-parent z claimed so far

        # Knowledge Vector Space D2 (composition) -- an independent
        # part-of tree, same shape as the is-a tree above but keyed off
        # partOf_uuid instead of isA_uuid.
        self._concept_d2_z = []
        self._whole_of = []      # sparse: part_idx -> whole_idx (-1 = none)
        self._whole_of_col = []  # part_idx -> which column holds its own part-of edge
        self._d2_next_gap_bound = {}  # whole_idx -> closest-to-parent z claimed so far

        # Knowledge Vector Space D3 (Relationship/Verb Concept
        # generalisation) -- shares the SAME _parent_of/_parent_col is-a
        # tree D1 uses (module docstring); this is only the z array a
        # ConceptKind.Relationship concept's own is-a edge writes into.
        self._concept_d3_z = []
        self._d3_next_gap_bound = {}  # parent_idx -> closest-to-parent z claimed so far

        # Seeded PAD (spec 41.2), per Concept -- read by D4's r for
        # whichever Concept is a given edge's source.
        self._concept_pad_pleasure = []
        self._concept_pad_arousal = []
        self._concept_pad_dominance = []

        # Knowledge Vector Space D4's s (operator-function state, spec
        # 9.5) -- sparse per edge, caller-defined value (this file
        # doesn't define the state enumeration itself).
        self._edge_operator_state = {}

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

    # _M_theta's fill value is NaN (unassigned causal/entailment position,
    # module docstring), not 0 like every other matrix's default -- grown
    # separately so a freshly grown region reads as "unassigned", not as
    # a spuriously real theta=0.0.
    _ZERO_FILLED_MATRICES = ("_M_confidence", "_M_provenance", "_M_temporal",
                              "_M_activation", "_M_inference_depth", "_M_origin", "_M_band")

    def _grow_rows(self):
        new_capacity = self._capacity_rows * 2
        for attr in self._ZERO_FILLED_MATRICES:
            old = getattr(self, attr)
            new = np.zeros((new_capacity, self._capacity_cols), dtype=old.dtype)
            new[:self._n_rows, :self._n_cols] = old[:self._n_rows, :self._n_cols]
            setattr(self, attr, new)
        new_theta = np.full((new_capacity, self._capacity_cols), np.nan)
        new_theta[:self._n_rows, :self._n_cols] = self._M_theta[:self._n_rows, :self._n_cols]
        self._M_theta = new_theta
        self._capacity_rows = new_capacity

    def _grow_cols(self):
        new_capacity = self._capacity_cols * 2
        for attr in self._ZERO_FILLED_MATRICES:
            old = getattr(self, attr)
            new = np.zeros((self._capacity_rows, new_capacity), dtype=old.dtype)
            new[:self._n_rows, :self._n_cols] = old[:self._n_rows, :self._n_cols]
            setattr(self, attr, new)
        new_theta = np.full((self._capacity_rows, new_capacity), np.nan)
        new_theta[:self._n_rows, :self._n_cols] = self._M_theta[:self._n_rows, :self._n_cols]
        self._M_theta = new_theta
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
        self._concept_d1_z.append(D1_D2_ROOT)
        self._concept_d2_z.append(D1_D2_ROOT)
        self._concept_d3_z.append(D1_D2_ROOT)
        self._concept_pad_pleasure.append(0.0)
        self._concept_pad_arousal.append(0.0)
        self._concept_pad_dominance.append(0.0)
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
                          partOf_uuid=None, band=Band.AttributeRelationshipCompletion):
        """O(1) amortized: writes directly into the persistent matrices.
        No rebuild, no scan -- this IS the storage, updated in place.

        If this edge IS an is-a edge (isA_uuid matches), also updates the
        persistent SPARSE parent-index array -- O(1), not the O(C^2) dense
        matrix this replaced -- and this concept's own Knowledge Vector
        Space D1 z coordinate (module docstring). Assumes single
        inheritance (a tree). Symmetrically, if this edge IS a part-of
        edge (partOf_uuid matches), updates the sparse whole-of array and
        this concept's D2 z coordinate, on an entirely independent tree.
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
            # Which Dimension this is-a edge positions is decided purely
            # by the source's own kind (spec 41.5's part-of-speech
            # scoping, module docstring's D3/D4 section) -- D1 for a
            # noun, D3 for a verb/Relationship concept; HYPERNYM (this
            # same is-a edge) is genuinely the one kind shared between
            # the two, so no separate parameter is needed to tell them
            # apart.
            if source.kind == ConceptKind.Noun:
                self._concept_d1_z[row] = self._position_below(dest_key, self._d1_next_gap_bound, self._concept_d1_z)
            elif source.kind == ConceptKind.Relationship:
                self._concept_d3_z[row] = self._position_below(dest_key, self._d3_next_gap_bound, self._concept_d3_z)

        if partOf_uuid is not None and relationship.uuid == partOf_uuid and isinstance(dest_key, int):
            if row >= len(self._whole_of):
                pad = row - len(self._whole_of) + 1
                self._whole_of.extend([-1] * pad)
                self._whole_of_col.extend([0] * pad)
            self._whole_of[row] = dest_key
            self._whole_of_col[row] = col
            self._concept_d2_z[row] = self._position_below(dest_key, self._d2_next_gap_bound, self._concept_d2_z)

        return RelationshipRef(self, row, col)

    def _position_below(self, parent_idx: int, next_gap_bound: dict, z_array: list) -> float:
        """Fractional/gap indexing (spec 41.9): the new child's z is the
        midpoint between its parent's z and the closest-to-parent
        boundary already claimed by one of that parent's other children
        (D1_D2_BOTTOM if this is the first child) -- so each successive
        child packs in progressively closer to the parent, leaving every
        child the largest possible remaining span down to Bottom for its
        own descendants (module docstring). Only this one row's z is
        ever written -- no sibling or ancestor is touched, so inserting
        a new child is O(1) and never invalidates a coordinate anyone
        else already read."""
        parent_z = z_array[parent_idx]
        bound = next_gap_bound.get(parent_idx, D1_D2_BOTTOM)
        new_z = fractional_midpoint(parent_z, bound)
        next_gap_bound[parent_idx] = new_z
        return new_z

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

    # -- Knowledge Vector Space: noun structural identity (spec 12.1) --

    def noun_structural_distance(self, a: ConceptRef, b: ConceptRef) -> float:
        """dN(A,B) = sqrt((D1(A)-D1(B))^2 + (D2(A)-D2(B))^2) -- spec
        12.1. Coincidence in only D1 or only D2 is deliberately not
        enough on its own to suggest identity; both axes are combined
        into the one Euclidean distance here rather than compared
        separately, which is what keeps a caller from accidentally
        checking just one."""
        return math.sqrt((a.d1_z - b.d1_z) ** 2 + (a.d2_z - b.d2_z) ** 2)

    def classify_noun_identity(self, a: ConceptRef, b: ConceptRef) -> str:
        """Spec 41.3's three-way identity classification, applied to
        noun_structural_distance: "MergeCandidate" (at or below
        epsilon_merge), "ReviewCandidate" (above epsilon_merge, at or
        below epsilon_review), or "Distinct" (above epsilon_review).
        This never merges or mutates anything itself -- a classification
        is evidence for a caller to act on (spec 12's "identity
        hypothesis"), not an automatic merge."""
        distance = self.noun_structural_distance(a, b)
        if distance <= self.epsilon_merge:
            return "MergeCandidate"
        if distance <= self.epsilon_review:
            return "ReviewCandidate"
        return "Distinct"

    # -- Knowledge Vector Space: PAD (spec 41.2) --

    def set_pad(self, concept: ConceptRef, pleasure: float, arousal: float, dominance: float) -> None:
        """Seeds/authors this Concept's own PAD triple. Never called
        automatically -- unlike D1/D2/D3, PAD isn't derived from any
        relationship this graph already records, so a caller (a
        seeding script, e.g. mirroring vocabulary/'s pad_seeding.py)
        must supply it explicitly."""
        idx = concept.idx
        self._concept_pad_pleasure[idx] = pleasure
        self._concept_pad_arousal[idx] = arousal
        self._concept_pad_dominance[idx] = dominance

    # -- Knowledge Vector Space D4: Relationship composition and mechanics (spec 9, 41.1) --

    def d4_source_composition(self, relationship: RelationshipRef) -> float:
        """Qc(R) = Composition(Source(R)) = D2(Source(R)) -- spec 9.1,
        41.1. No storage of its own: this edge's source Concept's own
        D2 z already IS Qc, read fresh every call so it's never stale
        against a source whose own composition position changes later."""
        return relationship.source.d2_z

    def d4_pad_amplitude(self, relationship: RelationshipRef) -> float:
        """r = ||PAD(Source(R))||_2 -- spec 41.2. Reads the edge's
        source Concept's own seeded PAD triple (set_pad), not a
        separate per-edge value."""
        pleasure, arousal, dominance = relationship.source.pad
        return math.sqrt(pleasure ** 2 + arousal ** 2 + dominance ** 2)

    def theta(self, relationship: RelationshipRef) -> float:
        """theta(R) -- this edge's causal/entailment angular position
        (spec 9.2). NaN until assign_causal_chain places it in a
        chain (module docstring's "unassigned", not an error)."""
        return self._M_theta[relationship.source_idx, relationship.verb_col]

    def d4_cartesian(self, relationship: RelationshipRef):
        """(x, y) = (r cos theta, r sin theta) -- spec 9.4/41.4's
        polar-to-Cartesian derivation, used for Euclidean distance
        (12.2). (nan, nan) if theta hasn't been assigned yet -- a
        genuinely undefined position, not a fabricated (0, 0)."""
        r = self.d4_pad_amplitude(relationship)
        th = self.theta(relationship)
        return (r * math.cos(th), r * math.sin(th))

    def set_operator_state(self, relationship: RelationshipRef, state) -> None:
        """s(R) -- spec 9.5. `state` is caller-defined (this file
        doesn't enumerate operator states, spec 9.5's own "defined
        independently by the Relationship execution model")."""
        self._edge_operator_state[(relationship.source_idx, relationship.verb_col)] = state

    def operator_state(self, relationship: RelationshipRef):
        return self._edge_operator_state.get((relationship.source_idx, relationship.verb_col))

    def d4(self, relationship: RelationshipRef) -> tuple:
        """D4(R) = (Qc, theta, r, s) -- spec 41.1, computed fresh, not
        stored (module docstring)."""
        return (
            self.d4_source_composition(relationship),
            self.theta(relationship),
            self.d4_pad_amplitude(relationship),
            self.operator_state(relationship),
        )

    # -- Knowledge Vector Space: causal/entailment chains (spec 9.2, 40.4) --

    def assign_causal_chain(self, chain: List[RelationshipRef]) -> dict:
        """Assigns theta_i = i * (2*pi/n) to each of n edges in `chain`,
        spec 9.2's Delta-theta = 2*pi/n. `chain` is given in sequence
        order (chain[0] -> chain[1] -> ... -> chain[n-1]); this method
        does not reorder or deduplicate it -- a caller that wants
        synonymous relationship positions collapsed into one semantic
        step (spec 9.2's own "synonyms... do not independently increase
        chain length") must have already done that before calling.

        Returns whether the chain actually CLOSES (spec 9.2's own
        completeness rule, R0 -> ... -> Rn-1 -> R0): every step's
        destination must equal the next step's source, and the last
        step's destination must equal the first step's source. Theta is
        still assigned even when it doesn't close -- an open chain is
        valid incomplete knowledge (spec 40.4/40.5), not rejected, just
        reported as open so a caller can decide whether to insert an
        Unknown placeholder (not implemented here, spec 40.5)."""
        n = len(chain)
        if n == 0:
            return {"n": 0, "delta_theta": None, "closed": False}
        delta_theta = 2 * math.pi / n

        closed = True
        for i, edge in enumerate(chain):
            self._M_theta[edge.source_idx, edge.verb_col] = i * delta_theta
            next_edge = chain[(i + 1) % n]
            if edge.destination is None or edge.destination.idx != next_edge.source_idx:
                closed = False

        return {"n": n, "delta_theta": delta_theta, "closed": closed}

    # -- Knowledge Vector Space: Relationship structural identity (spec 12.2) --

    def relationship_structural_distance(self, a: RelationshipRef, b: RelationshipRef) -> float:
        """dR(A,B) -- spec 12.2: D3 (the two edges' own verb Concepts'
        generalisation/specificity) combined with D4's numeric
        coordinates (Qc and the Cartesian position r/theta produce,
        spec 12.2's own "Dimension 4 expands into its applicable
        numeric coordinates"). s (operator state) is categorical, not
        a Euclidean coordinate, so it's deliberately excluded from this
        distance rather than forced into it -- two edges with the same
        D3/Qc/x/y but different operator state are still geometrically
        coincident here; a caller that also cares about operator state
        compares it separately via operator_state()."""
        a_x, a_y = self.d4_cartesian(a)
        b_x, b_y = self.d4_cartesian(b)
        return math.sqrt(
            (a.relationship_concept.d3_z - b.relationship_concept.d3_z) ** 2
            + (self.d4_source_composition(a) - self.d4_source_composition(b)) ** 2
            + (a_x - b_x) ** 2
            + (a_y - b_y) ** 2
        )

    def classify_relationship_identity(self, a: RelationshipRef, b: RelationshipRef) -> str:
        """Spec 41.3's three-way identity classification, applied to
        relationship_structural_distance -- same thresholds, same
        "evidence, not an automatic merge" discipline as
        classify_noun_identity."""
        distance = self.relationship_structural_distance(a, b)
        if distance <= self.epsilon_merge:
            return "MergeCandidate"
        if distance <= self.epsilon_review:
            return "ReviewCandidate"
        return "Distinct"
