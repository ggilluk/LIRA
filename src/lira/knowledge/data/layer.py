"""
Knowledge Layer: holds ONE persistent graph (Graph Theory layer --
identity, topology, traceability) plus a collection of band-specific
tensor stores (ML layer). The graph's facts are kept in sync with the
tensors BY REFERENCE -- Band 1's tensor (TensorLiraGraph) is the
authoritative store for confidence/provenance/temporal/activation; other
bands don't duplicate that data, they reference it while maintaining
their OWN lightweight, band-specific structures (e.g. Band 3's
compartment membership) that a dense weight-duplicate would be wasteful
for.
"""
from ..agents import KnowledgeAgent
from .tensor_graph import Band, ConceptRef, FactOrigin, TensorLiraGraph, provenance_for_depth


class KnowledgeLayer:
    def __init__(self):
        self.graph = TensorLiraGraph()  # the ONE authoritative weight tensor lives here (Band 1's)
        self.agents: list[KnowledgeAgent] = []
        self._compartments = {}  # parent_idx -> list of child_idx, Band 3's own persistent structure

    def register(self, agent: KnowledgeAgent):
        self.agents.append(agent)

    def register_compartment(self, parent: ConceptRef, children: list):
        """Band 3's own persistent membership structure -- O(1) to update,
        maintained incrementally rather than re-derived from a full graph
        scan every time Band 3 runs."""
        self._compartments[parent.idx] = [c.idx for c in children]

    def find_liftable_attributes(self, parent: ConceptRef, threshold: float):
        """Band 3's find, reusing Band 1's tensor (self.graph._M_*) BY
        REFERENCE for the actual confidence values -- no separate weight
        storage, just this band's own coverage-aggregation logic layered
        on top of the same authoritative numbers Band 1 owns.
        """
        children_idx = self._compartments.get(parent.idx, [])
        if not children_idx:
            return []

        C, D = self.graph._n_rows, self.graph._n_cols
        conf = self.graph._M_confidence[:C, :D]

        candidates = []
        for col in range(D):
            verb_uuid = self.graph._col_verb_uuid[col]
            dest_key = self.graph._col_dest_key[col]

            # self-loop guard: never lift a relationship pointing back at the parent
            if isinstance(dest_key, int) and dest_key == parent.idx:
                continue

            child_confidences = conf[children_idx, col]
            present = child_confidences > 0
            coverage = present.sum() / len(children_idx)
            if coverage < threshold:
                continue

            # already-has check: does the parent already have this column filled?
            if conf[parent.idx, col] > 0:
                continue

            lifted_confidence = child_confidences[present].mean()
            contributing = [children_idx[i] for i in range(len(children_idx)) if present[i]]
            candidates.append((col, lifted_confidence, contributing, verb_uuid, dest_key))

        return candidates

    def add_lifted_attributes(self, parent: ConceptRef, candidates: list, log):
        """Band 3's add -- writes into the SAME tensor Band 1 owns (by
        reference), so anything Band 1 reads afterward sees these lifts
        immediately, with no synchronization step. Records lineage: each
        contributing child gets an equal share.
        """
        added = []
        for col, lifted_confidence, contributing, verb_uuid, dest_key in candidates:
            new_depth = max(int(self.graph._M_inference_depth[c, col]) for c in contributing) + 1
            provenance = provenance_for_depth(new_depth)
            equal_share = 1.0 / len(contributing)

            self.graph._M_confidence[parent.idx, col] = lifted_confidence
            self.graph._M_provenance[parent.idx, col] = provenance
            self.graph._M_temporal[parent.idx, col] = self.graph._M_temporal[contributing, col].mean()
            self.graph._M_activation[parent.idx, col] = 0.9999
            self.graph._M_inference_depth[parent.idx, col] = new_depth
            self.graph._M_origin[parent.idx, col] = FactOrigin.Inferred.value
            self.graph._M_band[parent.idx, col] = Band.Compartmentalisation.value
            self.graph._edge_uuid[(parent.idx, col)] = str(self.graph._uuid_mod.uuid4())
            self.graph._lineage[(parent.idx, col)] = [
                ((c, col), equal_share) for c in contributing
            ]
            added.append((parent.idx, col))

            log(f"  [Band3] lifted: parent_idx={parent.idx} col={col} "
                f"= mean(confidence over children {contributing}) = {lifted_confidence:.4f} "
                f"(inference_depth={new_depth}, provenance={provenance:.4f})")
        return added
