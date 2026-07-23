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

Deliberately NOT added: a VERB sense for `form`/`name`/`point`/`state`
via `promote_word` -- all four already have a promoted NOUN sense, and
`WordSeeder.promote_word`/`validate_assets()` reject a second promoted
entry sharing a lexical_form regardless of part_of_speech
(`promoted_lexical_forms` is a flat set of lexical_form strings, unlike
the mandatory/supplementary files' own `(lexical_form, part_of_speech)`
uniqueness check). `form` VERB sidesteps this by going through
`metalinguistic_verbs.json` instead (a different, POS-aware file); the
other three don't have a metalinguistic-file home to fall back on, so
their VERB senses are left unseeded -- surfaced, not fixed, the same
discipline the `cause` homograph bug already got in the previous batch."""

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
