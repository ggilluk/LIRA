/** Classifies every kind of relationship two Word entries can have to
 * each other. Values pack three fields into one integer -- group (2
 * bits), category (3 bits), item (3 bits) -- so a caller can classify
 * a value with bitwise operations alone (group()/category() below),
 * without a lookup table:
 *
 *     value = (group << 6) | (category << 3) | item
 *
 * Group 0 = Morphological, 1 = Lexical Semantic, 2 = Orthographic and
 * Naming (3 reserved for a future fourth group).
 *
 * Matches the Vocabulary Layer developer specification, 6.2. Ported
 * from vocabulary/data/lexical_relationship_type.py.
 *
 * PERTAINYM through USAGE_DOMAIN are this prototype's own addition (no
 * Python/spec equivalent) -- Princeton WordNet's dict/ files encode
 * pointer types (hypernym `@`, meronym `%p`/`%m`/`%s`, similar-to `&`,
 * domain `;c`/`;r`/`;u`, ...) the original spec's kind list has no
 * member for; role/word_seeder.ts's own relationshipKindForPointer maps
 * every WordNet pointer symbol onto either one of these or an existing
 * kind above (e.g. `~` on a verb synset becomes TROPONYM, not a new
 * kind, since LIRA already had that distinction). See each new member's
 * own comment for which WordNet pointer symbol it came from. */
export enum LexicalRelationshipType {
  // Morphological (group 0)
  // -- Base relation (category 0)
  LEMMA_FORM = 0,
  INFLECTION = 1,
  // -- Number (category 1)
  SINGULAR_FORM = 8,
  PLURAL_FORM = 9,
  // -- Tense (category 2)
  PRESENT_TENSE_FORM = 16,
  PAST_TENSE_FORM = 17,
  // -- Aspect (category 3)
  PRESENT_PARTICIPLE_FORM = 24,
  PAST_PARTICIPLE_FORM = 25,
  // -- Person (category 4)
  FIRST_PERSON_FORM = 32,
  SECOND_PERSON_FORM = 33,
  THIRD_PERSON_FORM = 34,
  // -- Degree (category 5)
  COMPARATIVE_FORM = 40,
  SUPERLATIVE_FORM = 41,
  // -- Derivation (category 6)
  DERIVED_FORM = 48,
  AGENT_NOUN_DERIVATION = 49,
  NOMINALISATION = 50,
  ADJECTIVAL_DERIVATION = 51,
  ADVERBIAL_DERIVATION = 52,
  // WordNet's own "pertainym" pointer (`\`) -- an adjective's relational
  // noun base ("presidential" pertains to "president") or an adverb's
  // adjective base -- ported from role/word_seeder.ts's own
  // pointer-to-kind mapping (relationshipKindForPointer). Distinct from
  // ADJECTIVAL_DERIVATION/ADVERBIAL_DERIVATION: those already cover a
  // clean base-to-derived-word pair (`+`, WordNet's "derivationally
  // related form"); a pertainym is "relates to" rather than "is formed
  // from", the same distinction WordNet itself draws between the two
  // pointer symbols.
  PERTAINYM = 53,
  // -- Pronoun Form (category 7 -- last available in this group; see
  // the module docstring's 3-bit category ceiling) -- deliberately not
  // DERIVED_FORM: a pronoun's object/possessive/reflexive form isn't a
  // derivational relationship (it doesn't change grammatical category
  // or add a prefix/suffix), it's a paradigm of the same pronoun.
  PRONOUN_OBJECT_FORM = 56,
  PRONOUN_SUBJECT_FORM = 57,
  PRONOUN_POSSESSIVE_DETERMINER_FORM = 58,
  PRONOUN_POSSESSIVE_FORM = 59,
  PRONOUN_REFLEXIVE_FORM = 60,
  PRONOUN_RECIPROCAL_FORM = 61,

  // Lexical Semantic (group 1)
  // -- Similarity / Opposition (category 0)
  SYNONYM = 64,
  ANTONYM = 65,
  // WordNet's `&` pointer, a satellite adjective synset's link to the
  // head synset it clusters around ("dry" satellite -> "arid" head) --
  // close in meaning, like SYNONYM, but WordNet itself keeps satellite
  // and head as separate synsets rather than merging them into one, so
  // this stays its own kind rather than becoming another SYNONYM edge.
  SIMILAR_TO = 66,
  // -- Hierarchy (category 1)
  HYPERNYM = 72,
  HYPONYM = 73,
  // WordNet's `@i`/`~i` pointers (class-inclusion, HYPERNYM/HYPONYM's
  // own "a dog is a kind of mammal", vs. instance-of, "Fido is an
  // instance of dog" -- a named individual rather than a subtype) are
  // deliberately never seeded (word_seeder.ts's own relationshipKindForPointer):
  // an instance relation isn't a lexical fact about the word "dog" the
  // way its hypernym/hyponym class-inclusion is, so this prototype
  // draws no distinction here and 74/75 stay retired rather than
  // reassigned to a different kind.
  // -- Part-Whole (category 2)
  MERONYM = 80,
  HOLONYM = 81,
  // WordNet distinguishes part-whole facts by what the "part" is -- a
  // piece of a larger whole (%p/#p: "wheel" part of "car"), a member of
  // a group (%m/#m: "tree" member of "forest"), or a substance a whole
  // is made of (%s/#s: "wood" substance of "table"). That distinction is
  // real, but it's a *property of one MERONYM fact*, not a different
  // relationship kind -- three separate kinds here would mean a caller
  // asking "what are this Word's meronyms" has to know to check three
  // kinds instead of one, and a mixed-kind whole (a "car" with a %p
  // wheel, a %m member of some collection, say) couldn't be queried as
  // one list at all. WordSeeder.seedWordNet stores every part/member/
  // substance fact as this same MERONYM kind and records which one it
  // is as a `meronymKind` qualifier (MERONYM_KIND_QUALIFIER below) on
  // the LexicalRelationship's own `qualifiers` (data/lexical_relationship.ts) --
  // the Common Vocabulary Cache's own hand-curated MERONYM/HOLONYM facts
  // simply leave it unset, same as they always have.
  // -- Manner (category 3)
  TROPONYM = 88,
  // -- Entailment / Causation (category 4)
  ENTAILMENT = 96,
  CAUSE = 97,
  // -- Unspecified (category 5)
  RELATED = 104,
  // WordNet's `^` pointer -- a hand-picked "see also" cross-reference
  // between related concepts that don't fit a crisper kind above (e.g.
  // a verb pointing to a related-but-distinct verb). Kept apart from
  // RELATED (LIRA's own general catch-all, not WordNet-specific) so a
  // WordNet-seeded "see also" edge is traceable back to that pointer
  // specifically.
  ALSO_SEE = 105,
  // WordNet's `$` pointer -- verb senses (in different synsets) close
  // enough in meaning that WordNet groups them without merging the
  // synsets outright, similar in spirit to SIMILAR_TO but verb-specific
  // and never crossing the satellite/head adjective structure SIMILAR_TO
  // is defined against.
  VERB_GROUP = 106,
  // WordNet's `=` pointer -- links an adjective to the noun naming the
  // attribute/dimension it's a value of ("hot"/"cold" both attribute
  // "temperature"). Neither hierarchy nor part-whole nor derivation;
  // its own kind for the same reason ALSO_SEE and VERB_GROUP get theirs.
  ATTRIBUTE = 107,
  // -- Domain / Classification (category 6) -- WordNet's own `;c`/`;r`/
  // `;u` (and their reciprocal `-c`/`-r`/`-u`, seeded as the same kind
  // with source/target swapped -- role/word_seeder.ts's own
  // relationshipKindForPointer) pointers: which subject-matter topic,
  // dialect/regional usage, or register a word or sense belongs to.
  // Classification, not similarity/hierarchy/part-whole/causation, so
  // it gets a category of its own rather than crowding into Unspecified.
  TOPIC_DOMAIN = 112,
  REGION_DOMAIN = 113,
  USAGE_DOMAIN = 114,

  // Orthographic and Naming (group 2)
  // -- Spelling Variation (category 0)
  SPELLING_VARIANT = 128,
  HISTORICAL_SPELLING = 129,
  // -- Shortening (category 1)
  ABBREVIATION = 136,
  ACRONYM = 137,
  INITIALISM = 138,
  CONTRACTION = 139,
  // -- Script Transformation (category 2)
  TRANSLITERATION = 144,
  CAPITALISATION = 145,
  DIACRITIC_VARIANT = 146,
}

export function relationshipGroup(kind: LexicalRelationshipType): number {
  return kind >> 6;
}

export function relationshipCategory(kind: LexicalRelationshipType): number {
  return (kind >> 3) & 0b111;
}

export function relationshipItem(kind: LexicalRelationshipType): number {
  return kind & 0b111;
}

// The AttributeValue.name (data/attribute_value.ts) WordSeeder.seedWordNet
// attaches to a MERONYM LexicalRelationship's own `qualifiers`, recording
// which of WordNet's three part-whole pointer families (%p/%m/%s, or
// their #p/#m/#s reciprocals) produced it -- MERONYM's own docstring
// above on why this is a qualifier, not a separate relationship kind.
// Absent (qualifiers stays []) for a hand-curated Common Vocabulary
// Cache MERONYM/HOLONYM fact, which draws no such distinction.
export const MERONYM_KIND_QUALIFIER = "meronymKind";

// MERONYM_KIND_QUALIFIER's own three possible AttributeValue.value
// strings -- word_seeder.ts's own relationshipKindForPointer picks one
// per WordNet pointer symbol (%p/#p -> "part", %m/#m -> "member",
// %s/#s -> "substance").
export type MeronymKind = "part" | "member" | "substance";
