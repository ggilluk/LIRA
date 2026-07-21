"""Hand-curated LexicalRelationship pairs among the Physics domain's
hydrated words, seeded once by physics_domain_seeding.py.

Why this exists: RelationshipSeeder only runs once, at Domain
creation, against the static assets/common/en/relationships/*.json
files -- which only cover the mandatory closed-class and metalinguistic
vocabulary. AsyncDictionaryHydrator only ever creates Word records; no
part of the existing pipeline creates a LexicalRelationship for a word
added later by hydration. Confirmed directly: after seeding, none of
the hydrated Physics words had a single relationship. This file is the
bounded, hand-authored fix for the Physics domain specifically -- the
same approach assets/common/en/relationships/*.json itself already
uses for the Common cache -- not a new automatic "relationship
hydration" pipeline stage.

Covers every Lexical Semantic kind (LexicalRelationshipType group 1)
with at least 5 genuine examples: SYNONYM, ANTONYM, HYPERNYM/HYPONYM,
MERONYM/HOLONYM, TROPONYM, ENTAILMENT, CAUSE. RELATED -- the group's
own "unspecified" catch-all -- is deliberately the smallest set here:
it is used only for pairs that are genuinely, meaningfully connected
but do not fit any of the more specific kinds above, never as a
default when a more specific kind would apply. physics_source_text.py
was extended (atom/nucleus/proton/neutron/electron,
melt/expand/attract, open/inverse/stationary, apply, characteristic,
speed) specifically to give the vocabulary enough breadth to support
this -- the original ~63-word set alone could not honestly support 5
real examples of, say, MERONYM/HOLONYM or CAUSE.

Directional conventions (verified against Word.py's derived
properties, which is the authoritative reader of this data):

- HYPERNYM edge is (narrower_word, HYPERNYM, broader_word) --
  X.hypernyms() reads outgoing HYPERNYM edges, so "electron"'s
  hypernym edge must point at "particle" for electron.hypernyms() to
  find it.
- HYPONYM edge is (broader_word, HYPONYM, narrower_word) -- the
  reverse of the HYPERNYM edge above, same pair, so
  particle.hyponyms() finds "electron".
- MERONYM edge is (part_word, MERONYM, whole_word) -- X.meronyms()
  reads *incoming* MERONYM edges (Word.py), so "car".meronyms() means
  "the things with a MERONYM edge pointing at car", i.e. car's own
  parts.
- HOLONYM edge is (whole_word, HOLONYM, part_word) -- the reverse of
  the MERONYM edge above, same pair; X.holonyms() reads *incoming*
  HOLONYM edges, so "wheel".holonyms() finds "car".
- TROPONYM edge is (general_word, TROPONYM, specific_manner_word) --
  X.troponyms() reads outgoing TROPONYM edges, so "move".troponyms()
  should find "flow"/"spin"/etc. No inverse kind is materialised (none
  is defined in LexicalRelationshipType for this), matching the
  existing CONTRACTION precedent in
  assets/common/en/relationships/README.md.
- ENTAILMENT edge is (entailing_verb, ENTAILMENT, entailed_verb) --
  "accelerate" ENTAILMENT "move" reads "to accelerate entails moving".
  One-directional, no inverse kind defined.
- CAUSE edge is (causing_verb, CAUSE, caused_verb) -- "exert" CAUSE
  "accelerate" reads "exerting (a force) causes accelerating".
  One-directional, no inverse kind defined.
- SYNONYM/ANTONYM/RELATED are genuinely symmetric -- seeded in both
  directions, matching assets/common/en/relationships/README.md's
  "Symmetric and inverse edges" convention for the Common cache.

Every entry gives an explicit part of speech per word, since several
are homographs (current: NOUN/ADJECTIVE; power: NOUN/VERB; potential:
NOUN/ADJECTIVE; wave/transfer/heat: NOUN/VERB) and a plain lexical_form
lookup would risk resolving the wrong sense."""

# (narrower_text, narrower_pos, broader_text, broader_pos) -- one HYPERNYM
# edge (narrower -> broader) and one HYPONYM edge (broader -> narrower)
# per pair.
HYPERNYM_HYPONYM_PAIRS = (
    ("charge", "NOUN", "property", "NOUN"),
    ("mass", "NOUN", "property", "NOUN"),
    ("resistance", "NOUN", "property", "NOUN"),
    ("particle", "NOUN", "matter", "NOUN"),
    ("heat", "NOUN", "energy", "NOUN"),
    ("mechanics", "NOUN", "physics", "NOUN"),
    ("thermodynamics", "NOUN", "physics", "NOUN"),
    ("electron", "NOUN", "particle", "NOUN"),
    ("proton", "NOUN", "particle", "NOUN"),
    ("neutron", "NOUN", "particle", "NOUN"),
)

# (part_text, part_pos, whole_text, whole_pos) -- one MERONYM edge
# (part -> whole) and one HOLONYM edge (whole -> part) per pair.
MERONYM_HOLONYM_PAIRS = (
    ("nucleus", "NOUN", "atom", "NOUN"),
    ("electron", "NOUN", "atom", "NOUN"),
    ("proton", "NOUN", "nucleus", "NOUN"),
    ("neutron", "NOUN", "nucleus", "NOUN"),
    ("crest", "NOUN", "wave", "NOUN"),
    ("conductor", "NOUN", "circuit", "NOUN"),
)

# (general_text, general_pos, specific_text, specific_pos) -- one
# TROPONYM edge (general -> specific), not reversed.
TROPONYM_PAIRS = (
    ("move", "VERB", "flow", "VERB"),
    ("move", "VERB", "spin", "VERB"),
    ("move", "VERB", "wave", "VERB"),
    ("move", "VERB", "transfer", "VERB"),
    ("move", "VERB", "accelerate", "VERB"),
)

# (entailing_text, entailing_pos, entailed_text, entailed_pos) -- one
# ENTAILMENT edge, not reversed.
ENTAILMENT_PAIRS = (
    ("accelerate", "VERB", "move", "VERB"),
    ("flow", "VERB", "move", "VERB"),
    ("transfer", "VERB", "move", "VERB"),
    ("possess", "VERB", "have", "VERB"),
    ("attract", "VERB", "exert", "VERB"),
)

# (causing_text, causing_pos, caused_text, caused_pos) -- one CAUSE
# edge, not reversed.
CAUSE_PAIRS = (
    ("heat", "VERB", "melt", "VERB"),
    ("heat", "VERB", "expand", "VERB"),
    ("exert", "VERB", "accelerate", "VERB"),
    ("exert", "VERB", "move", "VERB"),
    ("attract", "VERB", "move", "VERB"),
)

# (text_a, pos_a, text_b, pos_b) -- symmetric, seeded both directions.
SYNONYM_PAIRS = (
    ("net", "ADJECTIVE", "total", "ADJECTIVE"),
    ("possess", "VERB", "have", "VERB"),
    ("exert", "VERB", "apply", "VERB"),
    ("property", "NOUN", "characteristic", "NOUN"),
    ("velocity", "NOUN", "speed", "NOUN"),
)

# (text_a, pos_a, text_b, pos_b) -- symmetric, seeded both directions.
ANTONYM_PAIRS = (
    ("hot", "ADJECTIVE", "cold", "ADJECTIVE"),
    ("closed", "ADJECTIVE", "open", "ADJECTIVE"),
    ("kinetic", "ADJECTIVE", "potential", "ADJECTIVE"),
    ("proportional", "ADJECTIVE", "inverse", "ADJECTIVE"),
    ("moving", "ADJECTIVE", "stationary", "ADJECTIVE"),
)

# (text_a, pos_a, text_b, pos_b) -- symmetric, seeded both directions.
# Deliberately the smallest set of all eight kinds: RELATED is this
# group's own catch-all for a real but otherwise-unclassifiable
# connection, the lowest-priority kind, not a default.
RELATED_PAIRS = (
    ("force", "NOUN", "energy", "NOUN"),
    ("particle", "NOUN", "wave", "NOUN"),
    ("electric", "ADJECTIVE", "magnetic", "ADJECTIVE"),
    ("momentum", "NOUN", "velocity", "NOUN"),
)
