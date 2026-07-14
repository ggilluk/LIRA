from enum import Enum


class LexicalRelationshipType(Enum):
    """Classifies every kind of relationship two Word entries can have to
    each other. Values pack three fields into one integer -- group (2
    bits), category (3 bits), item (3 bits) -- so a caller can classify
    a value with bitwise operations alone (.group / .category below),
    without a lookup table:

        value = (group << 6) | (category << 3) | item

    Group 0 = Morphological, 1 = Lexical Semantic, 2 = Orthographic and
    Naming (3 reserved for a future fourth group).

    Matches the Vocabulary Layer developer specification, 6.2."""

    # Morphological (group 0)
    # -- Base relation (category 0)
    LEMMA_FORM = 0
    INFLECTION = 1
    # -- Number (category 1)
    SINGULAR_FORM = 8
    PLURAL_FORM = 9
    # -- Tense (category 2)
    PRESENT_TENSE_FORM = 16
    PAST_TENSE_FORM = 17
    # -- Aspect (category 3)
    PRESENT_PARTICIPLE_FORM = 24
    PAST_PARTICIPLE_FORM = 25
    # -- Person (category 4)
    FIRST_PERSON_FORM = 32
    SECOND_PERSON_FORM = 33
    THIRD_PERSON_FORM = 34
    # -- Degree (category 5)
    COMPARATIVE_FORM = 40
    SUPERLATIVE_FORM = 41
    # -- Derivation (category 6)
    DERIVED_FORM = 48
    AGENT_NOUN_DERIVATION = 49
    NOMINALISATION = 50
    ADJECTIVAL_DERIVATION = 51
    ADVERBIAL_DERIVATION = 52
    # -- Pronoun Form (category 7 -- last available in this group; see
    # the class docstring's 3-bit category ceiling) -- deliberately not
    # DERIVED_FORM: a pronoun's object/possessive/reflexive form isn't a
    # derivational relationship (it doesn't change grammatical category
    # or add a prefix/suffix), it's a paradigm of the same pronoun.
    PRONOUN_OBJECT_FORM = 56
    PRONOUN_SUBJECT_FORM = 57
    PRONOUN_POSSESSIVE_DETERMINER_FORM = 58
    PRONOUN_POSSESSIVE_FORM = 59
    PRONOUN_REFLEXIVE_FORM = 60
    PRONOUN_RECIPROCAL_FORM = 61

    # Lexical Semantic (group 1)
    # -- Similarity / Opposition (category 0)
    SYNONYM = 64
    ANTONYM = 65
    # -- Hierarchy (category 1)
    HYPERNYM = 72
    HYPONYM = 73
    # -- Part-Whole (category 2)
    MERONYM = 80
    HOLONYM = 81
    # -- Manner (category 3)
    TROPONYM = 88
    # -- Entailment / Causation (category 4)
    ENTAILMENT = 96
    CAUSE = 97
    # -- Unspecified (category 5)
    RELATED = 104

    # Orthographic and Naming (group 2)
    # -- Spelling Variation (category 0)
    SPELLING_VARIANT = 128
    HISTORICAL_SPELLING = 129
    # -- Shortening (category 1)
    ABBREVIATION = 136
    ACRONYM = 137
    INITIALISM = 138
    CONTRACTION = 139
    # -- Script Transformation (category 2)
    TRANSLITERATION = 144
    CAPITALISATION = 145
    DIACRITIC_VARIANT = 146

    @property
    def group(self) -> int:
        return self.value >> 6

    @property
    def category(self) -> int:
        return (self.value >> 3) & 0b111

    @property
    def item(self) -> int:
        return self.value & 0b111
