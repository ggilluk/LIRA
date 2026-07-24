"""Rule-based classification data for common_morphology_completion_seeding.py:
regular-inflection rules plus curated irregular-form tables and exclusion
sets, used to mechanically complete the Common Vocabulary Cache's
morphological relationship coverage (VERB conjugation, NOUN pluralisation,
ADJECTIVE/ADVERB degree forms, PRONOUN paradigm forms) with high
confidence, reserving exclusion lists only for genuinely irregular,
non-gradable, or uncountable cases rather than guessing them.

Every generated definition uses a plain, mechanical "{Kind} of {base}."
phrasing rather than the hand-tuned prose the rest of this dictionary
uses for inflected forms (e.g. "denotes": "Third person singular of
denote; is a sign or symbol of; indicates or signifies.") -- authoring a
genuine per-word gloss at this volume (over 1,000 new words) isn't
something that can be done without either fabricating content or an
infeasible amount of manual review, so this batch is deliberately,
visibly plainer instead (assets/common/en/README.md documents the
distinction).
"""

VOWELS = set("aeiou")


def _ends_in_consonant_vowel_consonant(word: str) -> bool:
    if len(word) < 3:
        return False
    c1, v, c2 = word[-3], word[-2], word[-1]
    return c1 not in VOWELS and v in VOWELS and c2 not in VOWELS and c2 != "w" and c2 != "y"


def _syllable_count(word: str) -> int:
    groups = 0
    prev_vowel = False
    for ch in word:
        is_vowel = ch in VOWELS
        if is_vowel and not prev_vowel:
            groups += 1
        prev_vowel = is_vowel
    return max(groups, 1)


# ---------------------------------------------------------------- verbs --

IRREGULAR_VERBS = {
    # base: (third_person, past_tense, past_participle, present_participle)
    "be": ("is", "was", "been", "being"),
    "have": ("has", "had", "had", "having"),
    "do": ("does", "did", "done", "doing"),
    "go": ("goes", "went", "gone", "going"),
    "say": ("says", "said", "said", "saying"),
    "make": ("makes", "made", "made", "making"),
    "know": ("knows", "knew", "known", "knowing"),
    "take": ("takes", "took", "taken", "taking"),
    "see": ("sees", "saw", "seen", "seeing"),
    "come": ("comes", "came", "come", "coming"),
    "think": ("thinks", "thought", "thought", "thinking"),
    "give": ("gives", "gave", "given", "giving"),
    "find": ("finds", "found", "found", "finding"),
    "tell": ("tells", "told", "told", "telling"),
    "become": ("becomes", "became", "become", "becoming"),
    "show": ("shows", "showed", "shown", "showing"),
    "leave": ("leaves", "left", "left", "leaving"),
    "feel": ("feels", "felt", "felt", "feeling"),
    "bring": ("brings", "brought", "brought", "bringing"),
    "begin": ("begins", "began", "begun", "beginning"),
    "keep": ("keeps", "kept", "kept", "keeping"),
    "hold": ("holds", "held", "held", "holding"),
    "write": ("writes", "wrote", "written", "writing"),
    "stand": ("stands", "stood", "stood", "standing"),
    "hear": ("hears", "heard", "heard", "hearing"),
    "let": ("lets", "let", "let", "letting"),
    "mean": ("means", "meant", "meant", "meaning"),
    "grow": ("grows", "grew", "grown", "growing"),
    "draw": ("draws", "drew", "drawn", "drawing"),
    "understand": ("understands", "understood", "understood", "understanding"),
    "choose": ("chooses", "chose", "chosen", "choosing"),
    "speak": ("speaks", "spoke", "spoken", "speaking"),
    "arise": ("arises", "arose", "arisen", "arising"),
    "bear": ("bears", "bore", "borne", "bearing"),
    "bend": ("bends", "bent", "bent", "bending"),
    "hit": ("hits", "hit", "hit", "hitting"),
    "hurt": ("hurts", "hurt", "hurt", "hurting"),
    "put": ("puts", "put", "put", "putting"),
    "shake": ("shakes", "shook", "shaken", "shaking"),
    "strike": ("strikes", "struck", "struck", "striking"),
    "undergo": ("undergoes", "underwent", "undergone", "undergoing"),
    "lay": ("lays", "laid", "laid", "laying"),
    "lead": ("leads", "led", "led", "leading"),
    "deal": ("deals", "dealt", "dealt", "dealing"),
}

DOUBLE_FINAL_CONSONANT = {
    "occur", "refer", "transfer", "prefer", "control", "travel", "equal",
    "fit", "begin", "permit", "submit", "commit", "omit", "plan",
    "label", "cancel", "model", "signal", "level", "fuel", "quarrel",
    "marvel", "rival", "total", "tunnel", "channel", "counsel",
}
NO_DOUBLE_EXCEPTIONS = {"fix", "mix", "box"}  # end in x -- x is never doubled

# VERB entries seeded as invariant mathematical/logical operators
# (examples/physics... no -- common_core_vocabulary_seeding.py's earlier
# "mathematics/logic operator VERBs" batch): used the same way as "plus"/
# "minus" regardless of grammatical subject, never conjugated.
OPERATOR_VERBS = {"and", "or", "nor", "nand", "not", "plus", "minus", "xor", "xnor", "equals"}

# VERB words discovered to be already-inflected forms whose LEMMA_FORM
# back-edge (and specific-kind forward edge from their real base) was
# never seeded -- their own definition already says so in plain English
# ("Third person singular of single (out); ..."), found by scanning every
# Common definition for this self-documenting pattern. Excluded here from
# fresh conjugation since add_self_documenting_backedges() wires them to
# their real base directly instead of treating them as bases themselves.
BACKEDGE_FIX_VERBS = {
    "according", "accounted", "acts", "arising", "arrives", "comes", "composed",
    "comprising", "consisting", "controlled", "decreases", "exchanging", "found",
    "identified", "kept", "meshed", "occupies", "opposes", "permits", "producing",
    "quantifies", "seen", "serving", "showing", "striking", "touched", "using",
    "varying", "singles",
}

# New VERB base senses this batch introduces (their own homograph NOUN/
# ADJECTIVE sense already existed; the corresponding VERB sense didn't,
# even though an inflected form of it -- accounted/controlled/using/
# singles -- was already sitting in the dictionary with a self-
# documenting definition naming this exact missing base).
NEW_BASE_VERBS = {
    "account": "To give an explanation or reason for something (usually followed by 'for').",
    "control": "To determine the behaviour or course of something; to exercise power or influence over.",
    "use": "To employ something for a particular purpose.",
    "single": "To pick out or identify one thing or person from among a group (usually followed by 'out').",
}


def conjugate_verb(base: str):
    """Returns (third_person, past_tense, past_participle, present_participle)."""
    if base in IRREGULAR_VERBS:
        return IRREGULAR_VERBS[base]

    if base.endswith(("s", "x", "z", "ch", "sh", "o")) and not base.endswith(("oo",)):
        third = base + "es"
    elif base.endswith("y") and base[-2] not in VOWELS:
        third = base[:-1] + "ies"
    else:
        third = base + "s"

    double = base in DOUBLE_FINAL_CONSONANT or (
        _ends_in_consonant_vowel_consonant(base)
        and base not in NO_DOUBLE_EXCEPTIONS
        and _syllable_count(base) == 1
    )

    if base.endswith("ee"):
        past = base + "d"
        past_participle = past
        present_participle = base + "ing"
    elif base.endswith("e"):
        past = base[:-1] + "ed"
        past_participle = past
        present_participle = base[:-1] + "ing"
    elif base.endswith("y") and base[-2] not in VOWELS:
        past = base[:-1] + "ied"
        past_participle = past
        present_participle = base + "ing"
    elif double:
        past = base + base[-1] + "ed"
        past_participle = past
        present_participle = base + base[-1] + "ing"
    else:
        past = base + "ed"
        past_participle = past
        present_participle = base + "ing"

    return (third, past, past_participle, present_participle)


# ---------------------------------------------------------------- nouns --

IRREGULAR_PLURALS = {
    "child": "children", "person": "people", "man": "men", "woman": "women",
    "foot": "feet", "tooth": "teeth", "mouse": "mice", "goose": "geese",
    "criterion": "criteria", "phenomenon": "phenomena", "datum": "data",
    "analysis": "analyses", "axis": "axes", "crisis": "crises",
    "hypothesis": "hypotheses", "thesis": "theses", "basis": "bases",
    "appendix": "appendices", "index": "indices", "matrix": "matrices",
    "vertex": "vertices", "formula": "formulae", "emphasis": "emphases",
}
INVARIANT_NOUNS = {"species", "series", "means", "physics", "mathematics", "news"}

# Uncountable / mass / abstract-singular nouns in this specific vocabulary
# that don't take a natural plural in the sense they're defined here, plus
# directional/categorical/currency nouns that don't pluralise, plus the
# six nouns already covered by add_self_documenting_backedges() (their
# existing plural is wired there instead of freshly generated) -- a wrong
# guess here would seed a genuinely non-English word ("advices",
# "knowledges"), so these are excluded rather than guessed.
NOUN_PLURAL_EXCLUDE = {
    "absence", "admiration", "advice", "air", "astonishment", "attention",
    "behaviour", "capitalisation", "carbon", "cessation", "chemistry",
    "courage", "damage", "data", "devotion", "discourse", "earth",
    "equipment", "exactness", "existence", "exponentiation", "extent",
    "false", "future", "grammar", "grief", "importance", "information",
    "iron", "knowledge", "left", "machinery", "manufacturing", "matter",
    "middle", "money", "nature", "null", "opposition", "ownership",
    "percent", "presence", "proximity", "reasoning", "recency",
    "recognition", "regard", "research", "rest", "satisfaction", "scope",
    "significance", "spite", "start", "steel", "sterling", "surroundings",
    "true", "understanding", "west", "work", "yen", "people",
    "context", "deduction", "moment", "strand", "type", "variety",
}


def pluralize_noun(base: str):
    if base in INVARIANT_NOUNS or base in NOUN_PLURAL_EXCLUDE:
        return None
    if base in IRREGULAR_PLURALS:
        return IRREGULAR_PLURALS[base]
    if base.endswith(("s", "x", "z", "ch", "sh")):
        return base + "es"
    if base.endswith("y") and base[-2] not in VOWELS:
        return base[:-1] + "ies"
    if base.endswith("fe"):
        return base[:-2] + "ves"
    if base.endswith("f"):
        return base[:-1] + "ves"
    if base.endswith("o") and base[-2] not in VOWELS and base not in {"photo", "piano", "halo"}:
        return base + "es"
    return base + "s"


# --------------------------------------------------------- adj/adverb  --

IRREGULAR_DEGREE = {
    "good": ("better", "best"), "well": ("better", "best"),
    "bad": ("worse", "worst"), "badly": ("worse", "worst"),
    "far": ("further", "furthest"), "little": ("less", "least"),
    "many": ("more", "most"), "much": ("more", "most"),
    "old": ("older", "oldest"),
}

# Categorical / absolute / periphrastic-only ADJECTIVEs that are
# grammatically ADJECTIVE but never take a single-word -er/-est form in
# standard English (always "more X"/"most X", or not gradable at all) --
# an explicit denylist since the syllable-count heuristic alone would
# wrongly generate forms like "directer", "perfecter", "ownest". Every
# base_adjs entry ending "-ing"/"-ed" (participial adjectives -- concerned,
# derived, missing, qualified, ...) is excluded by a blanket suffix check
# instead of listing each one.
ADJECTIVE_DEGREE_EXCLUDE = {
    "direct", "formal", "normal", "proper", "real", "social", "urgent",
    "sudden", "plural", "single", "total", "whole", "positive", "first",
    "second", "third", "past", "present", "male", "female", "own", "due",
    "main", "boolean", "comparative", "superlative", "demonstrative",
    "interrogative", "possessive", "reciprocal", "reflexive", "singular",
    "modal", "passive", "phrasal", "equal", "complex", "complete", "perfect",
    "close", "large",  # already covered by add_self_documenting_backedges()
}

# Only these ADVERBs (not the many regular -ly manner adverbs, which are
# always periphrastic -- "more carefully", never "carefullier") take a
# single-word inflected comparative/superlative.
ADVERB_DEGREE_ALLOW = {"fast", "soon", "far", "long", "early", "hard", "close"}


def degree_forms(base: str, part_of_speech: str = "ADJECTIVE"):
    """Returns (comparative, superlative) or None if not eligible for a
    single-word inflected form."""
    if base in IRREGULAR_DEGREE:
        return IRREGULAR_DEGREE[base]

    if part_of_speech == "ADVERB" and base not in ADVERB_DEGREE_ALLOW:
        return None
    if part_of_speech == "ADJECTIVE" and base in ADJECTIVE_DEGREE_EXCLUDE:
        return None
    if base.endswith(("ing", "ed")):
        return None

    syllables = _syllable_count(base)

    if base.endswith("e") and syllables <= 2:
        return (base + "r", base + "st")
    if base.endswith("y") and base[-2] not in VOWELS and syllables <= 2:
        return (base[:-1] + "ier", base[:-1] + "iest")
    if syllables <= 1 and _ends_in_consonant_vowel_consonant(base):
        return (base + base[-1] + "er", base + base[-1] + "est")
    if syllables <= 2:
        return (base + "er", base + "est")
    return None


# ------------------------------------------------------------- pronoun --

# PRONOUN paradigm gaps discovered against the live relationship cache:
# he/it are missing the standalone-possessive edge (English "his"/"its"
# are syncretic between possessive-determiner and possessive-pronoun use,
# the same syncretism the existing she->her/PRONOUN_OBJECT_FORM and
# she->her/PRONOUN_POSSESSIVE_DETERMINER_FORM edges already model by
# pointing both kinds at the one "her" word); who is missing its
# object/possessive forms entirely (whom/whose already exist as their own
# PRONOUN words with no incoming edges yet).
# (source_lexical_form, source_pos, kind, target_lexical_form, target_pos)
PRONOUN_PARADIGM_LINKS = (
    ("he", "PRONOUN", "PRONOUN_POSSESSIVE_FORM", "his", "DETERMINER"),
    ("it", "PRONOUN", "PRONOUN_POSSESSIVE_FORM", "its", "DETERMINER"),
    ("who", "PRONOUN", "PRONOUN_OBJECT_FORM", "whom", "PRONOUN"),
    ("who", "PRONOUN", "PRONOUN_POSSESSIVE_FORM", "whose", "PRONOUN"),
)

# self-documenting VERB/NOUN/ADJECTIVE back-edge fixes: every Common word
# whose own definition already announces it as an inflected form of
# another word ("Third person singular of single (out); ...") but whose
# LEMMA_FORM edge (and its base's specific-kind forward edge) was never
# actually wired -- found by regex-scanning every Common definition for
# this pattern (scripts/scan_self_documenting analysis, not re-run here
# since the findings are pinned as data).
# (derived_lexical_form, derived_pos, kind, base_lexical_form, base_pos)
SELF_DOCUMENTING_BACKEDGES = (
    ("according", "VERB", "PRESENT_PARTICIPLE_FORM", "accord", "VERB"),
    ("accounted", "VERB", "PAST_PARTICIPLE_FORM", "account", "VERB"),
    ("acts", "VERB", "THIRD_PERSON_FORM", "act", "VERB"),
    ("arising", "VERB", "PRESENT_PARTICIPLE_FORM", "arise", "VERB"),
    ("arrives", "VERB", "THIRD_PERSON_FORM", "arrive", "VERB"),
    ("closer", "ADJECTIVE", "COMPARATIVE_FORM", "close", "ADJECTIVE"),
    ("comes", "VERB", "THIRD_PERSON_FORM", "come", "VERB"),
    ("composed", "VERB", "PAST_PARTICIPLE_FORM", "compose", "VERB"),
    ("comprising", "VERB", "PRESENT_PARTICIPLE_FORM", "comprise", "VERB"),
    ("consisting", "VERB", "PRESENT_PARTICIPLE_FORM", "consist", "VERB"),
    ("contexts", "NOUN", "PLURAL_FORM", "context", "NOUN"),
    ("controlled", "VERB", "PAST_PARTICIPLE_FORM", "control", "VERB"),
    ("decreases", "VERB", "THIRD_PERSON_FORM", "decrease", "VERB"),
    ("deductions", "NOUN", "PLURAL_FORM", "deduction", "NOUN"),
    ("exchanging", "VERB", "PRESENT_PARTICIPLE_FORM", "exchange", "VERB"),
    ("found", "VERB", "PAST_TENSE_FORM", "find", "VERB"),
    ("found", "VERB", "PAST_PARTICIPLE_FORM", "find", "VERB"),
    ("identified", "VERB", "PAST_PARTICIPLE_FORM", "identify", "VERB"),
    ("kept", "VERB", "PAST_TENSE_FORM", "keep", "VERB"),
    ("kept", "VERB", "PAST_PARTICIPLE_FORM", "keep", "VERB"),
    ("larger", "ADJECTIVE", "COMPARATIVE_FORM", "large", "ADJECTIVE"),
    ("meshed", "VERB", "PAST_PARTICIPLE_FORM", "mesh", "VERB"),
    ("moments", "NOUN", "PLURAL_FORM", "moment", "NOUN"),
    ("occupies", "VERB", "THIRD_PERSON_FORM", "occupy", "VERB"),
    ("opposes", "VERB", "THIRD_PERSON_FORM", "oppose", "VERB"),
    ("permits", "VERB", "THIRD_PERSON_FORM", "permit", "VERB"),
    ("producing", "VERB", "PRESENT_PARTICIPLE_FORM", "produce", "VERB"),
    ("quantifies", "VERB", "THIRD_PERSON_FORM", "quantify", "VERB"),
    ("seen", "VERB", "PAST_PARTICIPLE_FORM", "see", "VERB"),
    ("serving", "VERB", "PRESENT_PARTICIPLE_FORM", "serve", "VERB"),
    ("showing", "VERB", "PRESENT_PARTICIPLE_FORM", "show", "VERB"),
    ("strands", "NOUN", "PLURAL_FORM", "strand", "NOUN"),
    ("striking", "VERB", "PRESENT_PARTICIPLE_FORM", "strike", "VERB"),
    ("touched", "VERB", "PAST_PARTICIPLE_FORM", "touch", "VERB"),
    ("types", "NOUN", "PLURAL_FORM", "type", "NOUN"),
    ("using", "VERB", "PRESENT_PARTICIPLE_FORM", "use", "VERB"),
    ("varieties", "NOUN", "PLURAL_FORM", "variety", "NOUN"),
    ("varying", "VERB", "PRESENT_PARTICIPLE_FORM", "vary", "VERB"),
    ("singles", "VERB", "THIRD_PERSON_FORM", "single", "VERB"),
)
