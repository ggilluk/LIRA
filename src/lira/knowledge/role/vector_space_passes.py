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

`detect_and_assign_causal_chains` is that second pass: it walks the
seeded CAUSE/ENTAILMENT edges as a directed graph and threads each
connected run of them into one chain, honestly reporting whether it
closes (spec 9.2's own completeness rule) rather than assuming it does
-- most won't, in real seeded data (a handful of pairwise "X causes Y"
facts rarely happens to form a closed cycle), and that's spec 40.4's
own valid incomplete state, not a bug to work around.

`run_vector_space_passes` also runs `vector_space_audit` as a closing
pass, so a caller gets one report covering everything this graph's own
structural checks can say about the result of both passes together."""

from typing import Dict, List

from ..data.tensor_graph import RelationshipRef, TensorLiraGraph
from .dictionary_seeder import DictionarySeeder


def _edge_key(edge: RelationshipRef):
    return (edge.source_idx, edge.verb_col)


def detect_and_assign_causal_chains(graph: TensorLiraGraph, seeder: DictionarySeeder) -> dict:
    """Every seeded CAUSE/ENTAILMENT edge, threaded into as few chains
    as the data actually supports and handed to `assign_causal_chain`
    -- a chain starts at an edge whose source Concept is never any
    other CAUSE/ENTAILMENT edge's destination (a genuine beginning),
    walks forward greedily through whichever not-yet-visited edge
    continues it, and stops when nothing continues it or it closes back
    on its own start. Two edges between the same (source, destination)
    -- e.g. a CAUSE edge and its required ENTAILMENT companion,
    asset_version 1.19.0's own reciprocal pairing -- are genuinely
    distinct RelationshipRefs (different verb_col) and each gets its
    own turn/chain; nothing here collapses them. Whatever's left after
    every genuine start has been walked is a pure cycle with no
    distinguished start (every node in it has an incoming edge too) --
    started arbitrarily from whichever edge sorts first, same
    Concept-index ordering start-selection already uses."""
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

    results = [graph.assign_causal_chain(chain) for chain in chains]
    return {
        "edges_considered": len(edges),
        "chains_assigned": len(chains),
        "closed_chains": sum(1 for r in results if r["closed"]),
        "longest_chain": max((r["n"] for r in results), default=0),
    }


def run_vector_space_passes(graph: TensorLiraGraph, seeder: DictionarySeeder) -> dict:
    """The full post-seeding pipeline a view should render *after*, not
    instead of -- causal-chain detection/assignment, then a closing
    `vector_space_audit` over the result. Returns both reports together
    under one dict so a caller (examples/knowledge_view_example.py) can
    log the whole pipeline's outcome in one place."""
    causal_chains = detect_and_assign_causal_chains(graph, seeder)
    audit = graph.vector_space_audit()
    return {"causal_chains": causal_chains, "audit": audit}
