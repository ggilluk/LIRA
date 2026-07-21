"""Hand-curated LexicalRelationship pairs among the Physics domain's
hydrated words, seeded once by physics_domain_seeding.py.

Why this exists: RelationshipSeeder only runs once, at Domain
creation, against the static assets/common/en/relationships/*.json
files -- which only cover the mandatory closed-class and metalinguistic
vocabulary. AsyncDictionaryHydrator only ever creates Word records; no
part of the existing pipeline creates a LexicalRelationship for a word
added later by hydration. Confirmed directly: after seeding, none of
the 81 hydrated Physics words had a single relationship. This file is
the bounded, hand-authored fix for the Physics domain specifically --
the same approach assets/common/en/relationships/*.json itself already
uses for the Common cache -- not a new automatic "relationship
hydration" pipeline stage (that would be a materially larger change:
its own external evidence source, its own ranking, its own scope
decisions about which relationship kinds to attempt).

Each entry is (source_text, source_part_of_speech, target_text,
target_part_of_speech, relationship_kind) -- part of speech is given
explicitly because several of these words are homographs
(current: NOUN/ADJECTIVE; potential: NOUN/ADJECTIVE; power: NOUN/VERB;
...) and a plain lexical_form lookup would risk resolving the wrong
sense. SYNONYM/ANTONYM/RELATED are treated as symmetric and seeded in
both directions, matching assets/common/en/relationships/README.md's
"Symmetric and inverse edges" convention for the Common cache.

Deliberately a small, illustrative set, not an attempt at a complete
Physics relationship graph -- exactly the kind of curated, defensible
pairs a person authoring this cache by hand would pick, not every
conceivable association."""

PHYSICS_RELATIONSHIPS = (
    ("hot", "ADJECTIVE", "cold", "ADJECTIVE", "ANTONYM"),
    ("net", "ADJECTIVE", "total", "ADJECTIVE", "SYNONYM"),
    ("charge", "NOUN", "current", "NOUN", "RELATED"),
    ("current", "NOUN", "flow", "NOUN", "RELATED"),
    ("force", "NOUN", "energy", "NOUN", "RELATED"),
    ("work", "NOUN", "energy", "NOUN", "RELATED"),
    ("power", "NOUN", "energy", "NOUN", "RELATED"),
    ("momentum", "NOUN", "velocity", "NOUN", "RELATED"),
    ("particle", "NOUN", "wave", "NOUN", "RELATED"),
    ("electric", "ADJECTIVE", "magnetic", "ADJECTIVE", "RELATED"),
    ("kinetic", "ADJECTIVE", "potential", "ADJECTIVE", "RELATED"),
    ("mass", "NOUN", "matter", "NOUN", "RELATED"),
)
