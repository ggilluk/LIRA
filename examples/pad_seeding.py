"""Assigns approximate Seeded Attributes for the PAD (Pleasure-Arousal-
Dominance, Mehrabian & Russell) affective framework to every entry in
the Common Vocabulary Cache: `seeded_pleasure_displeasure_weight`,
`seeded_arousal_non_arousal_weight`, `seeded_dominance_submissive_weight`
(Word's three new Seeded Attributes -- see word.py's own docstring).

Every entry in every cache file gets an explicit value, never left
null -- 0.0 is the seeded value for a genuinely affect-neutral word
(e.g. "noun", "adjacent", "true"), which most of this vocabulary's
grammar/mathematics/physics terminology genuinely is; null would mean
"not yet assigned", which is no longer true of anything in the cache
after this script runs.

Method: a hand-curated lexicon of ~110 affect-bearing concept roots
(CONCEPT_LEXICON below), each given one representative "full
intensity" PAD triple, applied verbatim to every inflected surface
form of that concept already present in the cache (looked up by exact
normalised_form -- FORM_LEXICON, built once from CONCEPT_LEXICON).
Every other word defaults to (0.0, 0.0, 0.0).

Per the task's own PAD framework guidance:
  a) NOUN entries carry the base PAD value of the concept itself.
  b) VERB entries carry the base PAD value of the action itself.
  c) Every other part of speech carries the weight it would apply to
     *modify* a base NOUN/VERB value when aggregated in the
     Linguistics layer (eventually -- no aggregation pipeline exists
     yet; this only seeds the per-word weight).
INTERJECTION is treated as its own base expression (not a modifier of
some other word), so it keeps full scale like NOUN/VERB.
ADJECTIVE/ADVERB get POS_SCALE's reduced "modifier" magnitude.
Every closed-class/structural part of speech (DETERMINER, PRONOUN,
PREPOSITION, CONJUNCTION, PARTICLE, PUNCTUATION, SYMBOL, NUMERAL,
AUXILIARY, PROPER_NOUN, OTHER) is forced to (0.0, 0.0, 0.0) regardless
of any lexicon match -- these carry no affect of their own to modify
or express.

Run: python3 examples/pad_seeding.py
"""

import json
from pathlib import Path
from typing import Dict, Tuple

ASSETS_DIR = Path(__file__).resolve().parent.parent / "src" / "lira" / "vocabulary" / "assets" / "common" / "en"

WORD_FILES = (
    "determiners.json", "pronouns.json", "auxiliaries.json", "prepositions.json",
    "coordinating_conjunctions.json", "subordinating_conjunctions.json", "particles.json",
    "punctuation.json", "symbols.json", "numerals.json",
    "metalinguistic_nouns.json", "metalinguistic_verbs.json", "metalinguistic_adjectives.json",
    "metalinguistic_adverbs.json", "metalinguistic_proper_nouns.json", "metalinguistic_interjections.json",
    "promoted_words.json",
)

# Parts of speech that carry a word's own base PAD value (full scale)
# rather than a modifier weight -- NOUN/VERB per the task's (a)/(b),
# plus INTERJECTION, which expresses affect directly rather than
# modifying some other base word.
BASE_SCALE_POS = {"NOUN", "VERB", "INTERJECTION"}
# ADJECTIVE/ADVERB modify a base NOUN/VERB value when aggregated (c) --
# seeded here at reduced magnitude, since a modifier's own pull on the
# aggregate is smaller than the base concept itself.
MODIFIER_SCALE_POS = {"ADJECTIVE", "ADVERB"}
POS_SCALE = {**{pos: 1.0 for pos in BASE_SCALE_POS}, **{pos: 0.6 for pos in MODIFIER_SCALE_POS}}
# Every other PartOfSpeech (DETERMINER, PRONOUN, PREPOSITION,
# CONJUNCTION, PARTICLE, PUNCTUATION, SYMBOL, NUMERAL, AUXILIARY,
# PROPER_NOUN, OTHER) gets POS_SCALE.get(pos, 0.0) == 0.0 -- always
# neutral, regardless of lexicon match.

# (pleasure, arousal, dominance), each in [-1.0, 1.0] -- full intensity,
# scaled down per POS_SCALE above for ADJECTIVE/ADVERB entries.
CONCEPT_LEXICON: Dict[str, Tuple[float, float, float]] = {
    # -- Positive emotion / achievement --
    "joy": (0.85, 0.6, 0.5),
    "admiration": (0.7, 0.4, 0.3),
    "satisfaction": (0.7, 0.2, 0.4),
    "triumph": (0.8, 0.7, 0.7),
    "welcome": (0.6, 0.3, 0.3),
    "courage": (0.5, 0.5, 0.6),
    "respect": (0.5, 0.3, 0.4),
    "achieve": (0.6, 0.4, 0.5),
    "guarantee": (0.4, 0.2, 0.5),
    "desire": (0.5, 0.5, 0.1),
    "grow": (0.3, 0.4, 0.3),
    "growth": (0.3, 0.4, 0.3),
    "want": (0.2, 0.4, 0.0),
    "hope": (0.6, 0.4, 0.2),
    "success": (0.7, 0.4, 0.5),
    "successful": (0.7, 0.3, 0.5),
    "protect": (0.5, 0.4, 0.6),
    "attract": (0.5, 0.5, 0.2),
    # -- Surprise / wonder --
    "surprise": (0.3, 0.75, -0.1),
    "surprising": (0.2, 0.7, -0.1),
    "astonishment": (0.2, 0.8, -0.1),
    "wow": (0.7, 0.8, 0.1),
    "hurrah": (0.8, 0.8, 0.5),
    "huzzah": (0.8, 0.8, 0.5),
    # -- Negative emotion --
    "grief": (-0.75, 0.5, -0.3),
    "pain": (-0.8, 0.5, -0.5),
    "regret": (-0.6, 0.3, -0.3),
    "doubt": (-0.3, 0.3, -0.3),
    "hesitation": (-0.2, 0.2, -0.3),
    "disagreement": (-0.4, 0.3, -0.1),
    "disturbance": (-0.4, 0.5, -0.2),
    "difficulty": (-0.4, 0.3, -0.3),
    "impossibility": (-0.3, 0.2, -0.4),
    "impossible": (-0.4, 0.3, -0.4),
    "inability": (-0.3, 0.2, -0.5),
    "unable": (-0.3, 0.1, -0.5),
    "spite": (-0.6, 0.5, 0.3),
    "damage": (-0.6, 0.5, -0.2),
    "problem": (-0.4, 0.4, -0.2),
    "concern": (-0.2, 0.4, -0.1),
    "fail": (-0.6, 0.4, -0.5),
    "alas": (-0.6, 0.4, -0.4),
    "ouch": (-0.6, 0.7, -0.3),
    "hurt": (-0.7, 0.5, 0.3),
    "harm": (-0.6, 0.5, 0.3),
    "harmful": (-0.6, 0.4, 0.2),
    "refusal": (-0.3, 0.3, 0.2),
    "hmm": (-0.1, 0.2, -0.1),
    "avoid": (-0.1, 0.3, -0.2),
    "need": (0.0, 0.4, -0.2),
    "lack": (-0.3, 0.3, -0.3),
    # -- Violence / danger / high-arousal aggressive action --
    "kill": (-0.9, 0.7, 0.8),
    "collide": (-0.4, 0.7, 0.1),
    "strike": (-0.3, 0.6, 0.5),
    "shake": (-0.2, 0.6, -0.1),
    "violent": (-0.6, 0.8, 0.6),
    "violently": (-0.5, 0.8, 0.5),
    "urgent": (-0.1, 0.7, 0.3),
    "escape": (0.4, 0.7, 0.3),
    "rapid": (0.1, 0.6, 0.1),
    "rapidly": (0.1, 0.6, 0.1),
    "vigorous": (0.4, 0.7, 0.5),
    "forceful": (0.1, 0.5, 0.6),
    "forcefully": (0.0, 0.5, 0.6),
    # -- Calm / low arousal --
    "peaceful": (0.6, -0.4, 0.2),
    "steady": (0.3, -0.2, 0.4),
    "careful": (0.2, -0.1, 0.3),
    "carefully": (0.2, -0.1, 0.3),
    "easily": (0.3, -0.1, 0.2),
    "easy": (0.3, -0.1, 0.2),
    "gentle": (0.4, -0.3, -0.1),
    "mild": (0.2, -0.3, -0.1),
    "still": (0.1, -0.4, 0.0),
    # -- Power / control / dominance --
    "power": (0.2, 0.4, 0.7),
    "control": (0.2, 0.3, 0.6),
    "exert": (0.0, 0.4, 0.5),
    "dominant": (0.1, 0.4, 0.8),
    "govern": (0.1, 0.3, 0.6),
    "command": (0.1, 0.4, 0.7),
    "superior": (0.4, 0.2, 0.6),
    "royal": (0.3, 0.2, 0.6),
    "authoritative": (0.2, 0.3, 0.7),
    "strong": (0.4, 0.3, 0.7),
    "firm": (0.2, 0.2, 0.5),
    "weak": (-0.3, 0.1, -0.6),
    "resistant": (0.0, 0.3, 0.4),
    "prevent": (0.0, 0.3, 0.4),
    "push": (0.0, 0.4, 0.4),
    "pull": (0.0, 0.3, 0.3),
    "twist": (-0.1, 0.4, 0.0),
    # -- Neutral-but-notable intensity/quality adjectives --
    "great": (0.6, 0.3, 0.4),
    "important": (0.3, 0.3, 0.4),
    "polite": (0.4, 0.1, 0.1),
    "fast": (0.2, 0.6, 0.2),
    "clear": (0.3, 0.1, 0.3),
    "empty": (-0.3, -0.2, -0.3),
    "full": (0.3, 0.1, 0.2),
    "able": (0.3, 0.1, 0.4),
    "money": (0.3, 0.2, 0.3),
    "interest": (0.3, 0.4, 0.1),
    "challenge": (0.1, 0.5, 0.2),
    "chance": (0.2, 0.4, 0.0),
    "attention": (0.1, 0.3, 0.1),
    # -- Interjections not already covered above --
    "ah": (0.1, 0.3, 0.0),
    "hey": (0.2, 0.4, 0.1),
    "no": (-0.3, 0.3, 0.2),
    "oh": (0.0, 0.4, -0.1),
    "please": (0.2, 0.2, -0.1),
    "well": (0.1, 0.1, 0.1),
    "yes": (0.4, 0.3, 0.2),
}

# Concept root -> every exact surface form in the cache that should
# receive its PAD triple, expanded once at import time via simple
# suffix rules and cross-checked against the cache's actual words at
# apply-time (a generated form with no matching cache entry is just
# never looked up -- harmless, not an error).
_INFLECTION_SUFFIXES = ("", "s", "es", "d", "ed", "ing", "er", "est")


def _expand_form_lexicon() -> Dict[str, Tuple[float, float, float]]:
    forms: Dict[str, Tuple[float, float, float]] = {}
    for root, pad in CONCEPT_LEXICON.items():
        forms[root] = pad
        for suffix in _INFLECTION_SUFFIXES:
            forms[root + suffix] = pad
        if root.endswith("y") and len(root) > 1 and root[-2] not in "aeiou":
            forms[root[:-1] + "ier"] = pad
            forms[root[:-1] + "iest"] = pad
            forms[root[:-1] + "ily"] = pad
            forms[root[:-1] + "ied"] = pad
            forms[root[:-1] + "ies"] = pad
        if root.endswith("e"):
            forms[root[:-1] + "ing"] = pad
            forms[root[:-1] + "ed"] = pad
    return forms


FORM_LEXICON = _expand_form_lexicon()

# A handful of irregular forms CONCEPT_LEXICON's suffix expansion
# doesn't reach, keyed straight to their own concept's triple.
_IRREGULAR_FORMS = {
    "grew": CONCEPT_LEXICON["grow"],
    "grown": CONCEPT_LEXICON["grow"],
    "grows": CONCEPT_LEXICON["grow"],
    "growing": CONCEPT_LEXICON["grow"],
    "struck": CONCEPT_LEXICON["strike"],
    "striking": CONCEPT_LEXICON["strike"],
    "strikes": CONCEPT_LEXICON["strike"],
    "shook": CONCEPT_LEXICON["shake"],
    "shaken": CONCEPT_LEXICON["shake"],
    "shaking": CONCEPT_LEXICON["shake"],
    "shakes": CONCEPT_LEXICON["shake"],
    "fails": CONCEPT_LEXICON["fail"],
    "failed": CONCEPT_LEXICON["fail"],
    "failing": CONCEPT_LEXICON["fail"],
    "abler": CONCEPT_LEXICON["able"],
    "ablest": CONCEPT_LEXICON["able"],
    "harmfuler": CONCEPT_LEXICON["harmful"],
    "harmfulest": CONCEPT_LEXICON["harmful"],
    "royaler": CONCEPT_LEXICON["royal"],
    "royalest": CONCEPT_LEXICON["royal"],
    "welcomed": CONCEPT_LEXICON["welcome"],
    "welcomes": CONCEPT_LEXICON["welcome"],
    "welcoming": CONCEPT_LEXICON["welcome"],
    "achieved": CONCEPT_LEXICON["achieve"],
    "achieves": CONCEPT_LEXICON["achieve"],
    "achieving": CONCEPT_LEXICON["achieve"],
    "desired": CONCEPT_LEXICON["desire"],
    "desires": CONCEPT_LEXICON["desire"],
    "desiring": CONCEPT_LEXICON["desire"],
    "escaped": CONCEPT_LEXICON["escape"],
    "escapes": CONCEPT_LEXICON["escape"],
    "escaping": CONCEPT_LEXICON["escape"],
    "collided": CONCEPT_LEXICON["collide"],
    "collides": CONCEPT_LEXICON["collide"],
    "colliding": CONCEPT_LEXICON["collide"],
    "exerted": CONCEPT_LEXICON["exert"],
    "exerting": CONCEPT_LEXICON["exert"],
    "exerts": CONCEPT_LEXICON["exert"],
    "attracted": CONCEPT_LEXICON["attract"],
    "attracting": CONCEPT_LEXICON["attract"],
    "attracts": CONCEPT_LEXICON["attract"],
    "protected": CONCEPT_LEXICON["protect"],
    "protecting": CONCEPT_LEXICON["protect"],
    "protects": CONCEPT_LEXICON["protect"],
    "prevented": CONCEPT_LEXICON["prevent"],
    "preventing": CONCEPT_LEXICON["prevent"],
    "prevents": CONCEPT_LEXICON["prevent"],
    "hurting": CONCEPT_LEXICON["hurt"],
    "hurts": CONCEPT_LEXICON["hurt"],
    "avoided": CONCEPT_LEXICON["avoid"],
    "avoiding": CONCEPT_LEXICON["avoid"],
    "avoids": CONCEPT_LEXICON["avoid"],
    "needed": CONCEPT_LEXICON["need"],
    "needing": CONCEPT_LEXICON["need"],
    "needs": CONCEPT_LEXICON["need"],
    "lacked": CONCEPT_LEXICON["lack"],
    "lacking": CONCEPT_LEXICON["lack"],
    "lacks": CONCEPT_LEXICON["lack"],
    "pushed": CONCEPT_LEXICON["push"],
    "pushes": CONCEPT_LEXICON["push"],
    "pushing": CONCEPT_LEXICON["push"],
    "pulled": CONCEPT_LEXICON["pull"],
    "pulls": CONCEPT_LEXICON["pull"],
    "pulling": CONCEPT_LEXICON["pull"],
    "twisted": CONCEPT_LEXICON["twist"],
    "twists": CONCEPT_LEXICON["twist"],
    "twisting": CONCEPT_LEXICON["twist"],
    "wanted": CONCEPT_LEXICON["want"],
    "wanting": CONCEPT_LEXICON["want"],
    "wants": CONCEPT_LEXICON["want"],
    "hoped": CONCEPT_LEXICON["hope"],
    "hopes": CONCEPT_LEXICON["hope"],
    "hoping": CONCEPT_LEXICON["hope"],
    "joys": CONCEPT_LEXICON["joy"],
    "griefs": CONCEPT_LEXICON["grief"],
    "pains": CONCEPT_LEXICON["pain"],
    "regrets": CONCEPT_LEXICON["regret"],
    "doubts": CONCEPT_LEXICON["doubt"],
    "hesitations": CONCEPT_LEXICON["hesitation"],
    "disagreements": CONCEPT_LEXICON["disagreement"],
    "disturbances": CONCEPT_LEXICON["disturbance"],
    "difficulties": CONCEPT_LEXICON["difficulty"],
    "problems": CONCEPT_LEXICON["problem"],
    "concerns": CONCEPT_LEXICON["concern"],
    "refusals": CONCEPT_LEXICON["refusal"],
    "damages": CONCEPT_LEXICON["damage"],
    "triumphs": CONCEPT_LEXICON["triumph"],
    "respects": CONCEPT_LEXICON["respect"],
    "surprises": CONCEPT_LEXICON["surprise"],
    "chances": CONCEPT_LEXICON["chance"],
    "challenges": CONCEPT_LEXICON["challenge"],
    "interests": CONCEPT_LEXICON["interest"],
    "growths": CONCEPT_LEXICON["growth"],
    "harms": CONCEPT_LEXICON["harm"],
    "harmed": CONCEPT_LEXICON["harm"],
    "harming": CONCEPT_LEXICON["harm"],
    "controlled": CONCEPT_LEXICON["control"],
    "controlling": CONCEPT_LEXICON["control"],
    "controls": CONCEPT_LEXICON["control"],
    "governed": CONCEPT_LEXICON["govern"],
    "governing": CONCEPT_LEXICON["govern"],
    "governs": CONCEPT_LEXICON["govern"],
    "powers": CONCEPT_LEXICON["power"],
    "guaranteed": CONCEPT_LEXICON["guarantee"],
    "guaranteeing": CONCEPT_LEXICON["guarantee"],
    "guarantees": CONCEPT_LEXICON["guarantee"],
}
FORM_LEXICON.update(_IRREGULAR_FORMS)


def pad_for(normalised_form: str, part_of_speech: str) -> Tuple[float, float, float]:
    scale = POS_SCALE.get(part_of_speech, 0.0)
    if scale == 0.0:
        return (0.0, 0.0, 0.0)
    base = FORM_LEXICON.get(normalised_form)
    if base is None:
        return (0.0, 0.0, 0.0)
    return tuple(round(component * scale, 2) for component in base)


def apply_pad_to_file(filename: str) -> int:
    path = ASSETS_DIR / filename
    doc = json.loads(path.read_text())
    updated = 0
    for entry in doc["words"]:
        pleasure, arousal, dominance = pad_for(entry["normalised_form"], entry["part_of_speech"])
        entry["seeded_pleasure_displeasure_weight"] = pleasure
        entry["seeded_arousal_non_arousal_weight"] = arousal
        entry["seeded_dominance_submissive_weight"] = dominance
        if (pleasure, arousal, dominance) != (0.0, 0.0, 0.0):
            updated += 1
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    return updated


def run() -> Dict[str, int]:
    results = {}
    for filename in WORD_FILES:
        results[filename] = apply_pad_to_file(filename)
    return results


if __name__ == "__main__":
    results = run()
    total = sum(results.values())
    for filename, count in results.items():
        if count:
            print(f"{filename}: {count} words given a non-neutral PAD value")
    print(f"Total non-neutral PAD assignments: {total}")
