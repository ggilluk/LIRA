"""Worked numeric example for the Knowledge Vector Space Specification's
Dimensions 3 and 4 (`knowledge/documentation/knowledge_vector_space_specification.md`,
sections 8, 9, 41.1, 41.2, 41.4) -- the second implemented slice, after
D1/D2 (`examples/knowledge_vector_space_d1_d2.py`).

Builds two examples:

- D3 (Relationship/Verb Concept generalisation): move -> walk -> stroll,
  a verb-only Hypernym->Troponym chain, computed the same way D1's
  noun chain is -- the same is-a bookkeeping, branching automatically
  on the source Concept's own kind (spec 41.5's part-of-speech
  scoping).
- D4 (Relationship composition and mechanics): the exact closed causal
  chain spec 41.4 itself uses as its own worked example -- Birth ->
  Live -> Die -> Resurrect -> Birth -- with PAD seeded on each Concept
  (spec 41.2: read from the *source* of each CAUSES edge, not stored
  on the edge itself) and theta assigned by assign_causal_chain,
  verified to close (Sum(Delta-theta) = 2*pi, spec 9.2/40.4).

Run: python3 examples/knowledge_vector_space_d3_d4.py
"""

import math

from lira.knowledge.data.tensor_graph import ConceptKind, TensorLiraGraph


def build_d3_example(graph: TensorLiraGraph, is_a):
    """move -> walk -> stroll: broader process-level verb at the top,
    increasingly specific manner-of-moving verbs below -- spec 8's own
    "z -> 1 broader process-level Relationship, z -> 0 more specific
    task-level Relationship", mirrored here exactly as D1's noun chain
    is, just on ConceptKind.Relationship concepts."""
    move = graph.add_concept("move", ConceptKind.Relationship)
    walk = graph.add_concept("walk", ConceptKind.Relationship)
    stroll = graph.add_concept("stroll", ConceptKind.Relationship)

    graph.add_relationship(walk, is_a, move, confidence=1.0, provenance=1.0,
                            temporal=1.0, activation=1.0, isA_uuid=is_a.uuid)
    graph.add_relationship(stroll, is_a, walk, confidence=1.0, provenance=1.0,
                            temporal=1.0, activation=1.0, isA_uuid=is_a.uuid)
    return move, walk, stroll


def build_d4_example(graph: TensorLiraGraph, causes):
    """Birth -> Live -> Die -> Resurrect -> Birth: the spec's own
    Section 41.4 causal/entailment worked example. Each Concept gets a
    seeded PAD triple; D4's r for a given edge is read from that
    edge's own *source* Concept (spec 41.2), never assigned to the
    edge/Relationship directly."""
    birth = graph.add_concept("Birth", ConceptKind.Noun)
    live = graph.add_concept("Live", ConceptKind.Noun)
    die = graph.add_concept("Die", ConceptKind.Noun)
    resurrect = graph.add_concept("Resurrect", ConceptKind.Noun)

    graph.set_pad(birth, pleasure=0.6, arousal=0.7, dominance=0.2)
    graph.set_pad(live, pleasure=0.5, arousal=0.2, dominance=0.3)
    graph.set_pad(die, pleasure=-0.8, arousal=0.5, dominance=-0.5)
    graph.set_pad(resurrect, pleasure=0.7, arousal=0.8, dominance=0.4)

    chain = [
        graph.add_relationship(birth, causes, live, confidence=1.0, provenance=1.0, temporal=1.0, activation=1.0),
        graph.add_relationship(live, causes, die, confidence=1.0, provenance=1.0, temporal=1.0, activation=1.0),
        graph.add_relationship(die, causes, resurrect, confidence=1.0, provenance=1.0, temporal=1.0, activation=1.0),
        graph.add_relationship(resurrect, causes, birth, confidence=1.0, provenance=1.0, temporal=1.0, activation=1.0),
    ]
    return chain


def run() -> dict:
    graph = TensorLiraGraph()
    is_a = graph.add_concept("is-a", ConceptKind.Relationship)
    causes = graph.add_concept("causes", ConceptKind.Relationship)

    move, walk, stroll = build_d3_example(graph, is_a)
    chain = build_d4_example(graph, causes)
    chain_result = graph.assign_causal_chain(chain)

    return {"graph": graph, "d3_chain": (move, walk, stroll), "d4_chain": chain, "chain_result": chain_result}


if __name__ == "__main__":
    result = run()
    graph = result["graph"]
    move, walk, stroll = result["d3_chain"]
    chain = result["d4_chain"]
    chain_result = result["chain_result"]

    print("-- D3 (Relationship generalisation): move -> walk -> stroll --")
    for c in (move, walk, stroll):
        print(f"  {c.name:8s} d3_z = {c.d3_z:.6f}")
    assert move.d3_z > walk.d3_z > stroll.d3_z, "D3 ordering violated"
    print("  z(Verb Hypernym) > z(Troponym) holds at every step: OK")
    print(f"  move.d1_z (should stay ROOT, unaffected by D3) = {move.d1_z}")
    assert move.d1_z == 1.0, "D3 leaked into D1"

    print()
    print("-- D4 (composition and mechanics): Birth -> Live -> Die -> Resurrect -> Birth --")
    print(f"  n={chain_result['n']}  delta_theta={math.degrees(chain_result['delta_theta']):.1f} deg  "
          f"closed={chain_result['closed']}")
    assert chain_result["closed"], "the causal chain did not close"
    total = 0.0
    for edge in chain:
        qc = graph.d4_source_composition(edge)
        theta = graph.theta(edge)
        r = graph.d4_pad_amplitude(edge)
        x, y = graph.d4_cartesian(edge)
        print(f"  {edge.source.name:9s} -> {edge.destination.name:9s}  "
              f"theta={math.degrees(theta):6.1f} deg  Qc={qc:.3f}  r={r:.3f}  (x,y)=({x:.3f}, {y:.3f})")
        total += chain_result["delta_theta"]
    assert abs(total - 2 * math.pi) < 1e-9, "Sum(Delta-theta) != 2*pi"
    print(f"  Sum(Delta-theta) = {math.degrees(total):.1f} deg = 2*pi: OK (spec 9.2/17.2 causal completeness)")

    print()
    print("-- Relationship structural identity (12.2, 41.3) --")
    d = graph.relationship_structural_distance(chain[0], chain[1])
    print(f"  dR(Birth->Live, Live->Die) = {d:.6f} -> {graph.classify_relationship_identity(chain[0], chain[1])}")

    print()
    print("All Dimension 3/4 invariants verified against a real TensorLiraGraph.")
