"""Post-seeding Knowledge Vector Space passes -- run over an already-
`DictionarySeeder`-seeded `TensorLiraGraph`, before any view renders it
(knowledge/ui/knowledge_view.py). `DictionarySeeder` itself only ever
does the first pass (materialising Words/LexicalRelationships into
Concepts/edges, its own module docstring); it deliberately never calls
`assign_causal_chain` -- "nothing about one pairwise Vocabulary fact
identifies which cycle it belongs to" -- so every CAUSE/ENTAILMENT
edge's own theta (D4, spec 9.2) stays unassigned until a second pass
looks at the *shape* of those edges together, not just each one in
isolation.

`close_open_causal_chains` is that second pass, and it follows spec
40.4/40.5 for real rather than just reporting the gap: it walks the
seeded CAUSE/ENTAILMENT edges as a directed graph, threads each
connected run into one chain, and for any chain that doesn't already
close on its own (most won't, in real seeded data -- a handful of
pairwise "X causes Y" facts rarely happens to form a closed cycle)
instantiates a real `ConceptKind.Unknown` Concept "at the geometrically
implied position" (40.5's own phrase) rather than leaving the sequence
open: two new edges -- (chain's last Concept) -> Unknown, and Unknown ->
(chain's first Concept) -- extend the chain to a length that genuinely
closes, so `assign_causal_chain` assigns every edge, including the two
new ones, a real theta via the normal `Δθ = 2π/n` formula (spec 9.2),
not a fabricated one. The Unknown Concept is a real graph row -- it
shows up in D4 like any other edge endpoint, is addressable, and (spec
40.6) can later be resolved into a real Concept or merged once evidence
identifies what actually belongs there; it is never treated as
identical to any existing Concept.

`run_vector_space_passes` also runs `vector_space_audit` as a closing
pass, so a caller gets one report covering everything this graph's own
structural checks can say about the result of both passes together."""

from typing import Dict, List

from ..data.tensor_graph import (
    ConceptKind,
    FactOrigin,
    RelationshipRef,
    TensorLiraGraph,
    provenance_for_depth,
)
from .dictionary_seeder import DictionarySeeder

# The reified verb Concept close_open_causal_chains's own two closing
# edges are written against (module docstring) -- named once here so
# find_unknown_link_concept and close_open_causal_chains itself can
# never drift apart on the literal.
UNKNOWN_LINK_NAME = "unknown-link"


def _edge_key(edge: RelationshipRef):
    return (edge.source_idx, edge.verb_col)


def find_unknown_link_concept(graph: TensorLiraGraph):
    """The reified verb Concept close_open_causal_chains's own closing
    edges are written against, if that pass has already run against
    this graph -- None otherwise. Read-only: never creates one, unlike
    close_open_causal_chains's own graph.add_concept call, since a
    caller that only wants to render/report (knowledge/ui/knowledge_view.py)
    needs to know whether the pass has actually run, not have this
    silently make it look as if it has."""
    for concept in graph.all_concepts():
        if concept.name == UNKNOWN_LINK_NAME and concept.kind == ConceptKind.Relationship:
            return concept
    return None


def close_open_causal_chains(graph: TensorLiraGraph, seeder: DictionarySeeder) -> dict:
    """Every seeded CAUSE/ENTAILMENT edge, threaded into as few chains
    as the data actually supports -- a chain starts at an edge whose
    source Concept is never any other CAUSE/ENTAILMENT edge's
    destination (a genuine beginning), walks forward greedily through
    whichever not-yet-visited edge continues it, and stops when nothing
    continues it or it closes back on its own start. Two edges between
    the same (source, destination) -- e.g. a CAUSE edge and its
    required ENTAILMENT companion, asset_version 1.19.0's own
    reciprocal pairing -- are genuinely distinct RelationshipRefs
    (different verb_col) and each gets its own turn/chain; nothing here
    collapses them. Whatever's left after every genuine start has been
    walked is a pure cycle with no distinguished start (every node in
    it has an incoming edge too) -- started arbitrarily from whichever
    edge sorts first, same Concept-index ordering start-selection
    already uses.

    A chain that doesn't already close gets an Unknown Concept inserted
    (module docstring) before `assign_causal_chain` is ever called on
    it -- every chain this function hands to `assign_causal_chain`
    therefore closes for real, by construction, not just by report."""
    edges = graph.edges_by_verb(seeder.causes) + graph.edges_by_verb(seeder.entails)
    by_source: Dict[int, List[RelationshipRef]] = {}
    for edge in edges:
        by_source.setdefault(edge.source_idx, []).append(edge)
    destinations = {edge.destination.idx for edge in edges if edge.destination is not None}
    starts = sorted(idx for idx in by_source if idx not in destinations)

    visited = set()

    def walk(start_idx: int) -> List[RelationshipRef]:
        chain: List[RelationshipRef] = []
        current = start_idx
        while current in by_source:
            candidates = [e for e in by_source[current] if _edge_key(e) not in visited]
            if not candidates:
                break
            edge = candidates[0]
            visited.add(_edge_key(edge))
            chain.append(edge)
            if edge.destination is None or edge.destination.idx == start_idx:
                break
            current = edge.destination.idx
        return chain

    chains = [chain for chain in (walk(start) for start in starts) if chain]

    remaining = [e for e in edges if _edge_key(e) not in visited]
    while remaining:
        chain = walk(remaining[0].source_idx)
        if not chain:
            break  # every remaining edge's own source has nothing left to walk -- shouldn't happen, guards against an infinite loop if it somehow does
        chains.append(chain)
        remaining = [e for e in edges if _edge_key(e) not in visited]

    # A dedicated verb Concept for the two structural closing edges
    # below -- distinct from `causes`/`entails` (genuine seeded
    # Vocabulary facts) since these edges assert only that a link
    # belongs here, not any specific causal/entailment claim about it
    # (spec 40.5: the Unknown's semantic *identity* is Null, but its
    # structural position is fully known -- that asymmetry is exactly
    # what a separate verb makes visible).
    unknown_link = graph.add_concept(UNKNOWN_LINK_NAME, ConceptKind.Relationship)

    results = []
    unknown_concepts_inserted = 0
    for i, chain in enumerate(chains):
        closes_naturally = (chain[-1].destination is not None
                             and chain[-1].destination.idx == chain[0].source_idx)
        if closes_naturally:
            results.append(graph.assign_causal_chain(chain))
            continue

        # spec 40.4: "The missing position in the chain defines a
        # geometric gap." spec 40.5: instantiate an Unknown Concept "at
        # the geometrically implied position" rather than leaving the
        # sequence open. The last edge's own destination may itself be
        # unresolved (an Attribute destination, never true for a real
        # CAUSE/ENTAILMENT edge, but guarded rather than assumed) --
        # falls back to its source in that case so the walk always has
        # a real Concept to hang the Unknown off of.
        last_concept = chain[-1].destination if chain[-1].destination is not None else chain[-1].source
        first_concept = chain[0].source
        unknown_concept = graph.add_concept(f"Unknown::chain-{i}", ConceptKind.Unknown)
        edge_to_unknown = graph.add_relationship(
            last_concept, unknown_link, unknown_concept,
            confidence=1.0, provenance=provenance_for_depth(1), temporal=1.0, activation=1.0,
            origin=FactOrigin.Inferred,
        )
        edge_from_unknown = graph.add_relationship(
            unknown_concept, unknown_link, first_concept,
            confidence=1.0, provenance=provenance_for_depth(1), temporal=1.0, activation=1.0,
            origin=FactOrigin.Inferred,
        )
        results.append(graph.assign_causal_chain(chain + [edge_to_unknown, edge_from_unknown]))
        unknown_concepts_inserted += 1

    return {
        "edges_considered": len(edges),
        "chains_assigned": len(chains),
        "closed_chains": sum(1 for r in results if r["closed"]),
        "unknown_concepts_inserted": unknown_concepts_inserted,
        "longest_chain": max((r["n"] for r in results), default=0),
    }


def run_vector_space_passes(graph: TensorLiraGraph, seeder: DictionarySeeder) -> dict:
    """The full post-seeding pipeline a view should render *after*, not
    instead of -- causal-chain closure (spec 40.4/40.5), then a closing
    `vector_space_audit` over the result. Returns both reports together
    under one dict so a caller (examples/knowledge_view_example.py) can
    log the whole pipeline's outcome in one place."""
    causal_chains = close_open_causal_chains(graph, seeder)
    audit = graph.vector_space_audit()
    return {"causal_chains": causal_chains, "audit": audit}
