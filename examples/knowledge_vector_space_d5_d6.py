"""Worked numeric example for the Knowledge Vector Space Specification's
Dimensions 5 and 6 (`knowledge/documentation/knowledge_vector_space_specification.md`,
sections 14, 15, 41.6) -- the third implemented slice, after D1/D2
(`examples/knowledge_vector_space_d1_d2.py`) and D3/D4
(`examples/knowledge_vector_space_d3_d4.py`).

Domain-scale mirror of D1/D2, implemented on `HostedDomains`
(knowledge/data/hosted_domains.py) rather than TensorLiraGraph, since
D5/D6 are inherently cross-Domain: a single Domain's own graph has no
visibility into other Domains at all.

Builds the spec's own Section 5's Figure 5/6 D5 example
(Common -> Science -> Natural Science -> Physics -> Particle Physics)
and a D6 composition example (Engineering -> {MechanicalEngineering,
ElectricalEngineering}), against a real `LIRAHost` -- the "Common"
Domain every Host auto-creates (host.py) is exactly the spec's own
Common Domain outer boundary, not a stand-in for it.

Run: python3 examples/knowledge_vector_space_d5_d6.py
"""

from lira.knowledge.data.host import LIRAHost


def build_d5_example(host: LIRAHost):
    """Common -> Science -> Natural Science -> Physics -> Particle
    Physics, mirroring spec 41.4's D1 worked example one level up, at
    Domain scale."""
    common = host.hosted_domains.get("Common")
    science = host.get_or_create_domain("Science")
    natural_science = host.get_or_create_domain("NaturalScience")
    physics = host.get_or_create_domain("Physics")
    particle_physics = host.get_or_create_domain("ParticlePhysics")

    host.hosted_domains.register_domain_generalisation(science, common)
    host.hosted_domains.register_domain_generalisation(natural_science, science)
    host.hosted_domains.register_domain_generalisation(physics, natural_science)
    host.hosted_domains.register_domain_generalisation(particle_physics, physics)
    return common, science, natural_science, physics, particle_physics


def build_d6_example(host: LIRAHost):
    """Engineering -> {MechanicalEngineering, ElectricalEngineering}:
    a whole Domain with two compositional parts, same fractional/gap
    indexing D2's vehicle/engine/wheel/chassis example demonstrates."""
    engineering = host.get_or_create_domain("Engineering")
    mechanical = host.get_or_create_domain("MechanicalEngineering")
    electrical = host.get_or_create_domain("ElectricalEngineering")

    host.hosted_domains.register_domain_composition(mechanical, engineering)
    host.hosted_domains.register_domain_composition(electrical, engineering)
    return engineering, mechanical, electrical


def run() -> dict:
    host = LIRAHost("KnowledgeVectorSpaceD5D6Example")
    d5_chain = build_d5_example(host)
    d6_group = build_d6_example(host)
    return {"host": host, "d5_chain": d5_chain, "d6_group": d6_group}


if __name__ == "__main__":
    result = run()
    host = result["host"]
    common, science, natural_science, physics, particle_physics = result["d5_chain"]
    engineering, mechanical, electrical = result["d6_group"]
    domains = host.hosted_domains

    print("-- D5 (Domain generalisation): Common -> Science -> NaturalScience -> Physics -> ParticlePhysics --")
    for d in (common, science, natural_science, physics, particle_physics):
        print(f"  {d.name:16s} d5_z = {domains.d5_z(d):.6f}")
    assert (domains.d5_z(common) > domains.d5_z(science) > domains.d5_z(natural_science)
            > domains.d5_z(physics) > domains.d5_z(particle_physics)), "D5 ordering violated"
    print("  z(Domain Hypernym) > z(Domain Hyponym) holds at every step: OK")

    try:
        domains.register_domain_generalisation(common, science)
        raise AssertionError("Common was allowed to get a parent")
    except ValueError:
        print("  Common correctly refuses a parent -- it is the D5/D6 outer boundary")

    print()
    print("-- D6 (Domain composition): Engineering -> {MechanicalEngineering, ElectricalEngineering} --")
    print(f"  {engineering.name:22s} d6_z = {domains.d6_z(engineering):.6f}")
    for d in (mechanical, electrical):
        print(f"  {d.name:22s} d6_z = {domains.d6_z(d):.6f}")
        assert domains.d6_z(engineering) > domains.d6_z(d), "D6 ordering violated"
    assert domains.d6_z(mechanical) != domains.d6_z(electrical), "sibling parts collided on one z"
    print("  z(Domain Holonym) > z(Domain Meronym) holds for both parts, distinct: OK")

    print()
    print("-- Combined Domain structure (15.1) and identity (12.1-style, 41.3) --")
    print(f"  PD(Physics) = {domains.domain_structural_position(physics)}")
    print(f"  PD(ParticlePhysics) = {domains.domain_structural_position(particle_physics)}")
    d = domains.domain_structural_distance(physics, particle_physics)
    print(f"  distance(Physics, ParticlePhysics) = {d:.6f} -> {domains.classify_domain_identity(physics, particle_physics)}")
    d2 = domains.domain_structural_distance(physics, engineering)
    print(f"  distance(Physics, Engineering) = {d2:.6f} -> {domains.classify_domain_identity(physics, engineering)}")

    print()
    print("All Dimension 5/6 invariants verified against a real LIRAHost.")
