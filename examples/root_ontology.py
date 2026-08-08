"""Root ontology: the closed set of Concepts every other Common Concept's
D1 (noun generalisation) and D2 (noun composition) tree should
ultimately trace back to, rather than a Concept silently sitting at
D1_D2_ROOT by accident of incomplete seeding rather than by design. Six
WH-questions, each with a Hypernym root (the is-a ceiling for that
question) and a Meronym root (the part-of ceiling), user-supplied:

| Question | Top-level Hypernym | Verb Basis | Top-level Meronym | Verb Basis | Semantic Distinction |
|----------|--------------------|------------|--------------------|------------|----------------------|
| What?    | Entity             | --         | Part               | --         | Thing / constituent |
| Where?   | Place              | --         | Place              | --         | Location / spatial part |
| When?    | Time               | --         | Period             | --         | Temporal existence / temporal part |
| Who?     | Being              | be         | Member             | --         | Being / member of a whole |
| Why?     | Causation          | cause      | Contribution       | contribute | Cause / contributing part of causation |
| How?     | Operation          | operate    | Interaction        | interact   | Functioning / interactions constituting that functioning |

"Place" is deliberately the same Concept in both the Hypernym and
Meronym column for Where? -- a place composed of places is a real,
recursive structure (unlike Entity/Part, which are two distinct
Concepts), so it sits at D1_D2_ROOT on both axes simultaneously rather
than needing a second, redundant Concept.

Ten of the twelve underlying words already existed in Common with
definitions that already fit this role (entity, place, time, causation,
part, period, member, interaction, be, cause, operate, contribute) --
this batch only needs to add the three genuinely missing ones: "being"
(NOUN -- it only existed as be's own present-participle form before,
never as an independent noun), "contribution" (NOUN), and "interact"
(VERB). All three follow entity/place/time/cause's own precedent
(`metalinguistic_nouns.json`/`metalinguistic_verbs.json`, "LIRA English
Metalinguistic Vocabulary v1") rather than the generic, demand-driven
`WordSeeder.promote_word` path every other tier in this file uses --
these are foundational ontology, not vocabulary a Domain's own
definitions happened to need.

Two pre-existing relationships would otherwise have silently
disqualified a would-be root from actually being unparented, and are
removed here rather than left in place or reinterpreted:
- `member --MERONYM--> group` (+ `group --HOLONYM--> member`) made
  "member" a part of "group" -- the opposite of the root status Who?'s
  own Meronym column now assigns it.
- `operation --HYPERNYM--> process` (+ `process --HYPONYM--> operation`)
  made "operation" a hyponym of "process" -- the opposite of the root
  status How?'s own Hypernym column now assigns it.
Nothing else about "group"/"process" themselves changes; only the one
edge that reached up from the would-be root is gone. Every other
Concept in this table already had no disqualifying edge -- confirmed
directly against the live Dictionary before writing this file, not
assumed (see examples/root_ontology_seeding.py's own verification
step)."""

from typing import Dict, Optional, Tuple

# (question, hypernym_root, hypernym_verb, meronym_root, meronym_verb, distinction)
ROOT_ONTOLOGY: Tuple[Tuple[str, str, Optional[str], str, Optional[str], str], ...] = (
    ("What?", "Entity", None, "Part", None, "Thing / constituent"),
    ("Where?", "Place", None, "Place", None, "Location / spatial part"),
    ("When?", "Time", None, "Period", None, "Temporal existence / temporal part"),
    ("Who?", "Being", "be", "Member", None, "Being / member of a whole"),
    ("Why?", "Causation", "cause", "Contribution", "contribute", "Cause / contributing part of causation"),
    ("How?", "Operation", "operate", "Interaction", "interact", "Functioning / interactions constituting that functioning"),
)

# lexical_form -> (part_of_speech, definition) -- genuinely new words only.
NEW_METALINGUISTIC_NOUNS: Dict[str, Tuple[str, str]] = {
    "being": ("NOUN", "A living or conscious individual; the fact or state of existing."),
    "contribution": ("NOUN", "A part given or added to a larger whole, especially one that helps bring about a shared result."),
}
NEW_METALINGUISTIC_VERBS: Dict[str, Tuple[str, str]] = {
    "interact": ("VERB", "To act in such a way as to have an effect on each other; to communicate or work reciprocally."),
}

# (lemma, relationship_kind, inflected) -- standard forms for the newly
# added words only; every other root already has its own.
NEW_MORPHOLOGICAL_FORMS = (
    ("being", "PLURAL_FORM", "beings"),
    ("contribution", "PLURAL_FORM", "contributions"),
    ("interact", "THIRD_PERSON_FORM", "interacts"),
    ("interact", "PAST_TENSE_FORM", "interacted"),
    ("interact", "PAST_PARTICIPLE_FORM", "interacted"),
    ("interact", "PRESENT_PARTICIPLE_FORM", "interacting"),
)

# Every inflected form NEW_MORPHOLOGICAL_FORMS references needs to be a
# real Word in its own right too (RelationshipSeeder.seed_domain resolves
# a relationship's target_form against the live Dictionary, the same way
# every existing lemma's own inflected forms -- causing/caused/causes,
# operates/operated/operating -- are each their own promoted_words.json
# entry, not implied by the relationship alone). lexical_form -> (pos, definition).
NEW_INFLECTED_FORMS: Dict[str, Tuple[str, str]] = {
    "beings": ("NOUN", "Plural of being."),
    "contributions": ("NOUN", "Plural of contribution."),
    "interacts": ("VERB", "Third-person singular present of interact."),
    "interacted": ("VERB", "Past tense and past participle of interact."),
    "interacting": ("VERB", "Present participle of interact."),
}

# (verb, noun) -- the table's own "Verb Basis" column, wired as
# NOMINALISATION (+ reciprocal LEMMA_FORM), the same relationship kind
# `cause -> causation` already used (asset_version 1.15.0's own verb
# nominalisation batch) -- cause/causation already exists and is left
# alone; these four are new.
NOMINALISATION_PAIRS = (
    ("be", "being"),
    ("operate", "operation"),
    ("contribute", "contribution"),
    ("interact", "interaction"),
)

# (source_form, source_pos, kind, target_form, target_pos) -- the two
# disqualifying edge pairs, removed (module docstring).
DISQUALIFYING_EDGES_TO_REMOVE = (
    ("member", "NOUN", "MERONYM", "group", "NOUN"),
    ("group", "NOUN", "HOLONYM", "member", "NOUN"),
    ("operation", "NOUN", "HYPERNYM", "process", "NOUN"),
    ("process", "NOUN", "HYPONYM", "operation", "NOUN"),
)

# Every lexical_form this ontology cares about, whether newly added or
# already present -- used by the seeding script's own verification step
# to confirm each one lands at a real, unparented D1_D2_ROOT position
# once seeded, not just that the words/relationships exist.
ALL_ROOT_FORMS = frozenset({
    "entity", "place", "time", "being", "causation", "operation",
    "part", "period", "member", "contribution", "interaction",
})
ALL_VERB_BASIS_FORMS = frozenset({"be", "cause", "operate", "contribute", "interact"})
