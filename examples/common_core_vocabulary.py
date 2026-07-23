"""Classification and content for a user-supplied audit of missing core
Common vocabulary: words repeatedly needed by the *existing* Common
Vocabulary Cache's own definitions (word, sentence, clause, phrase,
noun, verb, auxiliary, preposition, conjunction, determiner, ...) but
not themselves seeded anywhere.

The audit's own "Assessment"/"Already present" columns were checked
directly against the live Dictionary before acting on anything (not
trusted at face value) -- several were stale, reflecting an earlier
state of this cache before the definition-gap and verb-nominalisation
batches already promoted some of the same words (`action`, `state`,
`part`, `question`, `world`, `reference`, `connection`, `represent`,
`refer`, `express`, `describe`, `modify`, `specify`, `relate`, `join`,
`perform`, `indicate` -- all already seeded; `tense`/`person`/`subject`
were already metalinguistic terms). Only genuinely absent words are
classified here.

Three placement tiers, not two -- an extension of the tiering already
used for definition-gap vocabulary:
- METALINGUISTIC: `mood`, `voice`, `predicate` are themselves grammar
  terminology (verb mood, grammatical voice, clause predicate), the
  same category `tense`/`aspect`/`person`/`subject` already occupy in
  `metalinguistic_nouns.json` -- hand-added there directly, not via
  `WordSeeder.promote_word`, matching that file's own curation
  discipline. `form` (VERB) joins `metalinguistic_verbs.json` as a
  second, homograph sense of the existing metalinguistic NOUN `form`
  ("to form a sentence/clause") -- exactly the `cause`/`result`-style
  NOUN+VERB homograph pattern that file already documents.
- PROMOTED: general open-class vocabulary with no metalinguistic
  flavour, via the same `WordSeeder.promote_word` path the previous two
  batches used.
- Bonus NOMINALISATION nouns (`production`, `introduction`,
  `containment`, `accompaniment`, `reception`) are not in the original
  audit table at all -- found while giving the newly-added verbs the
  same NOMINALISATION treatment as examples/verb_nominalisation_vocabulary.py,
  the natural next step for "all associated relationships for each
  word" applied to genuinely new verbs.

`form`/`name`/`point`/`state` all already had a promoted `NOUN` sense
before this file added their `VERB` senses too. `form` VERB went
straight into `metalinguistic_verbs.json` (a different, already
part-of-speech-aware file). `name`/`point`/`state` VERB were initially
left out: `WordSeeder.promote_word`/`validate_assets()` rejected a
second promoted entry sharing a lexical_form regardless of
part_of_speech (`promoted_lexical_forms` was a flat set of lexical_form
strings, unlike the mandatory/supplementary files' own
`(lexical_form, part_of_speech)` uniqueness check). Rather than route
around it, the actual bug was fixed directly in
`vocabulary/role/word_seeder.py` -- `validate_assets()`'s promoted-word
check now reuses the same `(lexical_form, part_of_speech)`
`seen_lexical_form_pos` set every mandatory/supplementary file is
already checked against (a promoted word may legitimately share a
lexical_form with an existing entry as long as its part_of_speech
differs -- the same "that" DETERMINER/PRONOUN homograph pattern), and
`promote_word`'s own pre-check got the identical fix. `name`/`point`/
`state` VERB are seeded below (PROMOTED_VERBS_SECOND_SENSE) now that
the mechanism supports it, completing the batch. `state` VERB and
`statement` (NOUN, already promoted) are a genuine NOMINALISATION pair
-- deliberately *not* wired as a relationship, though: "state" is now
a Common homograph, and RelationshipSeeder.seed_domain's own
resolution has the identical part-of-speech blind spot the `cause`
bug already surfaced, unfixed here (see the comment above
PROMOTED_VERBS_SECOND_SENSE)."""

from typing import Dict, List, Tuple

# lexical_form -> (part_of_speech, definition)
METALINGUISTIC_NOUNS: Dict[str, Tuple[str, str]] = {
    "mood": ("NOUN", "A temporary state of mind or feeling; in grammar, a verb form indicating whether an action is stated as fact, command, or possibility."),
    "voice": ("NOUN", "The sound produced through a person's mouth, used for speech; in grammar, the form of a verb indicating whether the subject performs or receives the action."),
    "predicate": ("NOUN", "The part of a sentence or clause that states something about the subject, typically including the verb."),
}

# lexical_form -> (part_of_speech, definition) -- joins the existing
# metalinguistic NOUN "form" as a second, homograph sense.
METALINGUISTIC_VERBS: Dict[str, Tuple[str, str]] = {
    "form": ("VERB", "To bring together the parts or elements of something so as to constitute it; to make or shape."),
}

# lexical_form -> (part_of_speech, definition) -- promoted, general
# open-class vocabulary.
PROMOTED_NOUNS: Dict[str, str] = {
    "idea": "A thought or suggestion about a possible course of action; a concept formed in the mind.",
    "group": "A number of people or things that are located, gathered, or classified together.",
    "statement": "A definite or clear expression of something in speech or writing.",
    "command": "An authoritative instruction to do something; an order.",
    "occurrence": "An incident or event; the fact or frequency of something happening.",
    "concept": "An abstract idea or general notion, especially one formed by combining other ideas.",
    "category": "A class or division of things regarded as having particular shared characteristics.",
    "shape": "The external form or outline of something, as distinct from its colour, texture, or material.",
    "distinction": "A difference or contrast between similar things; the recognition of such a difference.",
    "speech": "The expression of thoughts and feelings by articulate spoken sounds; a formal address delivered to an audience.",
    "utterance": "A spoken word, statement, or vocal sound.",
    # Bonus NOMINALISATION nouns -- not in the original audit table,
    # found while relating the new verbs below (see module docstring).
    "production": "The action of making or manufacturing something from its components; the amount produced.",
    "introduction": "The action of bringing something into use or existence for the first time; a preliminary explanation.",
    "containment": "The action of keeping something, especially something harmful, within limits.",
    "accompaniment": "A thing that accompanies another; something that occurs or exists alongside something else.",
    "reception": "The action of receiving something; the way in which something is received or welcomed.",
}

PROMOTED_VERBS: Dict[str, str] = {
    "stand": "To be in an upright position, supported by one's feet; to be positioned or located somewhere.",
    "contain": "To have or hold something within itself; to consist of or include.",
    "function": "To work or operate in a proper or particular way; to serve a particular purpose.",
    "lack": "To be without or deficient in something.",
    "introduce": "To bring into use or existence for the first time; to present someone or something by name.",
    "accompany": "To go somewhere with someone as a companion; to occur or exist alongside something.",
    "produce": "To make or manufacture something; to bring something into existence.",
    "receive": "To take, acquire, or be given something.",
    "take": "To lay hold of something with one's hands; to remove, carry, or accept something.",
    # Not in the audit table -- added to give "occurrence" a real verb
    # to nominalise, and to retroactively fix "occurs" (added in the
    # definition-gap batch as an unlinked standalone 3rd-person form,
    # since its true lemma "occur" didn't exist yet).
    "occur": "To happen or take place; to exist or be found.",
}

# (verb, noun) -- NOMINALISATION + reciprocal LEMMA_FORM, the same
# convention verb_nominalisation_vocabulary.py already established.
NOMINALISATION_PAIRS: List[Tuple[str, str]] = [
    ("occur", "occurrence"),
    ("produce", "production"),
    ("introduce", "introduction"),
    ("contain", "containment"),
    ("accompany", "accompaniment"),
    ("receive", "reception"),
]

# (lemma, inflected) -- THIRD_PERSON_FORM + reciprocal LEMMA_FORM,
# retroactively linking "occurs" (already seeded, previously an
# unlinked standalone form) to its true lemma "occur".
THIRD_PERSON_FORM_PAIRS: List[Tuple[str, str]] = [
    ("occur", "occurs"),
]

# (word_a, word_b) -- SYNONYM, both directions, the Common relationship
# cache's own established convention. Found directly, not forced: both
# words' own definitions above are near-paraphrases of each other.
SYNONYM_PAIRS: List[Tuple[str, str]] = [
    ("idea", "concept"),
]

# A second, VERB sense for three lexical_forms that already have a
# promoted NOUN sense -- only seedable now that WordSeeder's promoted-
# word uniqueness check is part-of-speech-aware (see module docstring).
PROMOTED_VERBS_SECOND_SENSE: Dict[str, str] = {
    "name": "To give a name to; to identify or refer to by name.",
    "point": "To direct someone's attention to something, especially by extending a finger; to face or indicate a particular direction.",
    "state": "To express something definitely or clearly in speech or writing.",
}

# NOT seeded: (state, NOMINALISATION, statement) -- a real relationship
# ("statement" already exists, PROMOTED_NOUNS above), but "state" is now
# a Common homograph too (NOUN promoted first, VERB promoted in
# PROMOTED_VERBS_SECOND_SENSE above), and RelationshipSeeder.seed_domain
# resolves a static cache entry's source_lexical_form via
# Dictionary.lookup() -- first-seeded-wins by text alone, still not
# part-of-speech-aware (this batch fixed WordSeeder's promoted-word
# uniqueness check, not RelationshipSeeder's resolution -- a
# considerably larger change, threading a part-of-speech disambiguator
# through the whole relationship-cache schema, not requested and not
# made here). Checked directly before writing anything, the same way
# the `cause` bug was found in the previous batch:
# `dictionary.lookup("state")` resolves to the NOUN, so a cache entry
# naming "state" as source would silently attach to the wrong sense --
# caught this time before shipping it, not after. Surfaced, not fixed,
# same as `cause`.
