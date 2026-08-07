"""Worked numeric example for the Knowledge Vector Space Specification's
Dimensions 1 and 2 (`knowledge/documentation/knowledge_vector_space_specification.md`,
sections 6, 7, 41.1, 41.9) -- the first implemented slice of that spec.

Builds the exact D1 example the spec's own section 41.4 illustrates
(Concept -> organism -> animal -> dog) plus a D2 composition example
(vehicle -> engine/wheel/chassis), against a real `TensorLiraGraph`,
computed by `add_relationship`'s own `isA_uuid`/`partOf_uuid` hooks --
not hand-typed numbers. Also demonstrates `noun_structural_distance`/
`classify_noun_identity` (12.1, 41.3): a near-duplicate concept created
at the same structural position, and a genuinely distinct one.

Run: python3 examples/knowledge_vector_space_d1_d2.py
"""

from lira.knowledge.data.tensor_graph import ConceptKind, FactOrigin, TensorLiraGraph


def build_d1_example(graph: TensorLiraGraph, is_a):
    """Concept -> organism -> animal -> dog, mirroring spec 41.4's Figure 1
    worked example exactly. Each add_relationship call below records a
    real is-a edge; D1 z is computed as a side effect, not asserted."""
    concept = graph.add_concept("Concept", ConceptKind.Noun)
    organism = graph.add_concept("organism", ConceptKind.Noun)
    animal = graph.add_concept("animal", ConceptKind.Noun)
    dog = graph.add_concept("dog", ConceptKind.Noun)

    graph.add_relationship(organism, is_a, concept, confidence=1.0, provenance=1.0,
                            temporal=1.0, activation=1.0, isA_uuid=is_a.uuid)
    graph.add_relationship(animal, is_a, organism, confidence=1.0, provenance=1.0,
                            temporal=1.0, activation=1.0, isA_uuid=is_a.uuid)
    graph.add_relationship(dog, is_a, animal, confidence=1.0, provenance=1.0,
                            temporal=1.0, activation=1.0, isA_uuid=is_a.uuid)
    return concept, organism, animal, dog


def build_d2_example(graph: TensorLiraGraph, part_of):
    """vehicle -> {engine, wheel, chassis}: a whole with three parts,
    demonstrating fractional/gap indexing assigning three distinct z
    values below the same parent (spec 41.9) -- sibling order among
    the three parts is not meaningful, only vehicle.d2_z > each part's
    d2_z, which every one of the three satisfies independently."""
    vehicle = graph.add_concept("vehicle", ConceptKind.Noun)
    engine = graph.add_concept("engine", ConceptKind.Noun)
    wheel = graph.add_concept("wheel", ConceptKind.Noun)
    chassis = graph.add_concept("chassis", ConceptKind.Noun)

    for part in (engine, wheel, chassis):
        graph.add_relationship(part, part_of, vehicle, confidence=1.0, provenance=1.0,
                                temporal=1.0, activation=1.0, partOf_uuid=part_of.uuid)
    return vehicle, engine, wheel, chassis


def run() -> dict:
    graph = TensorLiraGraph()
    is_a = graph.add_concept("is-a", ConceptKind.Relationship)
    part_of = graph.add_concept("part-of", ConceptKind.Relationship)

    concept, organism, animal, dog = build_d1_example(graph, is_a)
    vehicle, engine, wheel, chassis = build_d2_example(graph, part_of)

    # A near-duplicate "canine" concept, is-a'd to the same parent
    # (animal) as dog -- same D1 branch, but D2 (composition) never set,
    # so it's still distinguishable; a genuine duplicate would also need
    # a matching D2 position, per spec 12.1's "must converge simultaneously".
    canine = graph.add_concept("canine", ConceptKind.Noun)
    graph.add_relationship(canine, is_a, animal, confidence=1.0, provenance=1.0,
                            temporal=1.0, activation=1.0, isA_uuid=is_a.uuid)

    return {
        "graph": graph,
        "d1_chain": (concept, organism, animal, dog),
        "d2_group": (vehicle, engine, wheel, chassis),
        "canine": canine,
    }


if __name__ == "__main__":
    result = run()
    graph = result["graph"]
    concept, organism, animal, dog = result["d1_chain"]
    vehicle, engine, wheel, chassis = result["d2_group"]
    canine = result["canine"]

    print("-- D1 (generalisation): Concept -> organism -> animal -> dog --")
    for c in (concept, organism, animal, dog):
        print(f"  {c.name:10s} d1_z = {c.d1_z:.6f}")
    assert concept.d1_z > organism.d1_z > animal.d1_z > dog.d1_z, "D1 ordering violated"
    print("  z(Hypernym) > z(Hyponym) holds at every step: OK")

    print()
    print("-- D2 (composition): vehicle -> {engine, wheel, chassis} --")
    print(f"  {vehicle.name:10s} d2_z = {vehicle.d2_z:.6f}")
    for c in (engine, wheel, chassis):
        print(f"  {c.name:10s} d2_z = {c.d2_z:.6f}")
        assert vehicle.d2_z > c.d2_z, "D2 ordering violated"
    assert len({engine.d2_z, wheel.d2_z, chassis.d2_z}) == 3, "sibling parts collided on one z"
    print("  z(Holonym) > z(Meronym) holds for every part, all three distinct: OK")

    print()
    print("-- Noun structural identity (12.1, 41.3) --")
    print(f"  N(dog)    = {dog.noun_structural_position}")
    print(f"  N(canine) = {canine.noun_structural_position}")
    distance = graph.noun_structural_distance(dog, canine)
    print(f"  dN(dog, canine) = {distance:.6f} -> {graph.classify_noun_identity(dog, canine)}")
    print(f"  dN(dog, vehicle) = {graph.noun_structural_distance(dog, vehicle):.6f} "
          f"-> {graph.classify_noun_identity(dog, vehicle)}")

    print()
    print("All Dimension 1/2 invariants verified against a real TensorLiraGraph.")
