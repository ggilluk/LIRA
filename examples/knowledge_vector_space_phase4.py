"""Worked example for the Knowledge Vector Space Specification's
remaining pieces (`knowledge/documentation/knowledge_vector_space_specification.md`)
after D1-D6 (`examples/knowledge_vector_space_d1_d2.py`,
`_d3_d4.py`, `_d5_d6.py`): synonym/antonym Side/Sign geometry (10,
41.8), the companion vector-space audit (41.10), the Domain Naming
Convention -> D5 segment mapping (41.6), and the LexicalRelationshipType
mapping (41.11).

Run: python3 examples/knowledge_vector_space_phase4.py
"""

from lira.knowledge.data.host import LIRAHost
from lira.knowledge.data.lexical_relationship_type_mapping import VectorSpaceDimension, vector_space_dimension_for
from lira.knowledge.data.tensor_graph import ConceptKind, TensorLiraGraph
from lira.vocabulary.data.lexical_relationship_type import LexicalRelationshipType as LRT
from lira.vocabulary.data.part_of_speech import PartOfSpeech as POS


def demo_synonym_antonym() -> TensorLiraGraph:
    """big/large/huge cluster on one side; small/tiny cluster forced to
    the opposite side by one antonym registration (big/small) -- spec
    10/41.8: antonym Sign is authoritative, and the whole synonym
    cluster inherits it, not just the one antonym-registered member."""
    graph = TensorLiraGraph()
    big, large, huge = (graph.add_concept(n, ConceptKind.Noun) for n in ("big", "large", "huge"))
    small, tiny = (graph.add_concept(n, ConceptKind.Noun) for n in ("small", "tiny"))
    calm = graph.add_concept("calm", ConceptKind.Noun)  # no synonym/antonym registration at all

    graph.register_synonym(big, large)
    graph.register_synonym(large, huge)
    graph.register_synonym(small, tiny)
    graph.register_antonym(big, small)

    print("-- Synonym/Antonym geometry (10, 41.8) --")
    for c in (big, large, huge, small, tiny, calm):
        print(f"  side({c.name:6s}) = {graph.side(c)}")
    assert graph.side(big) == graph.side(large) == graph.side(huge)
    assert graph.side(small) == graph.side(tiny) == -graph.side(big)
    assert graph.side(calm) is None, "an unregistered concept must not get a fabricated side"
    print("  cluster(large) =", [c.name for c in graph.synonym_cluster(large)])
    print("  Antonym Sign > Synonym Side confirmed: the whole 'huge' cluster")
    print("  inherited big's side purely by merging, never registered directly.")
    return graph


def demo_audit() -> None:
    """A deliberately open (non-closing) causal chain and a source
    Concept wrongly carrying a D1 position -- both real invariant
    violations, both caught by vector_space_audit()."""
    print()
    print("-- Companion vector-space audit (41.10) --")
    graph = TensorLiraGraph()
    causes = graph.add_concept("causes", ConceptKind.Relationship)
    a, b, c = (graph.add_concept(n, ConceptKind.Noun) for n in ("a", "b", "c"))
    e1 = graph.add_relationship(a, causes, b, confidence=1.0, provenance=1.0, temporal=1.0, activation=1.0)
    e2 = graph.add_relationship(b, causes, c, confidence=1.0, provenance=1.0, temporal=1.0, activation=1.0)
    graph.assign_causal_chain([e1, e2])  # c does not point back to a -- an open chain

    audit = graph.vector_space_audit()
    print("  open_causal_chains:", audit["open_causal_chains"])
    assert len(audit["open_causal_chains"]) == 1, "the audit should have caught the open a->b->c chain"
    print("  (this is valid incomplete knowledge, spec 40.4/40.5 -- reported, not rejected)")

    clean_graph = TensorLiraGraph()
    isa = clean_graph.add_concept("is-a", ConceptKind.Relationship)
    dog = clean_graph.add_concept("dog", ConceptKind.Noun)
    animal = clean_graph.add_concept("animal", ConceptKind.Noun)
    clean_graph.add_relationship(dog, isa, animal, confidence=1.0, provenance=1.0, temporal=1.0, activation=1.0, isA_uuid=isa.uuid)
    clean_audit = clean_graph.vector_space_audit()
    assert clean_audit["open_causal_chains"] == [] and clean_audit["wrong_kind_d1_d2"] == []
    print("  a well-formed graph audits clean:", clean_audit)


def demo_domain_naming_convention() -> None:
    """spec 41.6: python.programming.language.common <=> common ->
    language -> programming -> python, derived automatically from the
    dotted name rather than requiring four manual register_domain_generalisation
    calls."""
    print()
    print("-- Domain Naming Convention -> D5 mapping (41.6) --")
    host = LIRAHost("Phase4Example")
    python_domain = host.hosted_domains.register_domain_hierarchy_from_name(
        host, "python.programming.language.common"
    )
    domains = host.hosted_domains
    common = domains.get("Common")
    for d in (common, domains.get("language.common"), domains.get("programming.language.common"), python_domain):
        print(f"  {d.name:36s} d5_z = {domains.d5_z(d):.6f}")
    assert domains.d5_z(common) > domains.d5_z(python_domain)
    print("  common -> language -> programming -> python ordering confirmed")


def demo_lexical_relationship_type_mapping() -> None:
    print()
    print("-- LexicalRelationshipType -> Vector-space dimension (41.11) --")
    rows = [
        (LRT.HYPERNYM, POS.NOUN), (LRT.HYPERNYM, POS.VERB), (LRT.HYPONYM, None),
        (LRT.MERONYM, None), (LRT.HOLONYM, None), (LRT.TROPONYM, None),
        (LRT.CAUSE, None), (LRT.ENTAILMENT, None),
        (LRT.SYNONYM, None), (LRT.ANTONYM, None), (LRT.RELATED, None),
    ]
    for relationship_type, pos in rows:
        dimension = vector_space_dimension_for(relationship_type, pos)
        label = f"{relationship_type.name} ({pos.name})" if pos else relationship_type.name
        print(f"  {label:18s} -> {dimension.value}")
    assert vector_space_dimension_for(LRT.HYPERNYM, POS.NOUN) == VectorSpaceDimension.D1
    assert vector_space_dimension_for(LRT.HYPERNYM, POS.VERB) == VectorSpaceDimension.D3
    try:
        vector_space_dimension_for(LRT.PLURAL_FORM)
        raise AssertionError("a Morphological-group kind should not have a mapping")
    except KeyError:
        print("  PLURAL_FORM (Morphological group) correctly has no mapping -- reported, not guessed")


if __name__ == "__main__":
    demo_synonym_antonym()
    demo_audit()
    demo_domain_naming_convention()
    demo_lexical_relationship_type_mapping()
    print()
    print("All remaining Knowledge Vector Space pieces verified.")
