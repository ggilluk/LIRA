/** Classifies every kind of relationship two Senses can have to each
 * other -- the true sense-to-sense semantic facts LexicalRelationshipType's
 * own "Lexical Semantic" group (group 1) used to hold before this split
 * (lexical_relationship_type.ts's own docstring on why LexicalRelationship
 * is word-to-word only from here on). Every member here is exactly one
 * of that group's own former members, unchanged in meaning -- this is a
 * relocation, not a redesign.
 *
 * `PERTAINYM` joins this enum too, even though it used to live in
 * LexicalRelationshipType's own Morphological group (group 0): verified
 * directly against the bundled WordNet data ("aural" sense 1 pertains to
 * "aura", its unrelated sense 2 pertains to "ear" -- two different real
 * meanings, two different targets) that a Pertainym fact is a property
 * of one specific *sense*, not of the word as a whole the way a genuine
 * derivational form (NOMINALISATION, ADJECTIVAL_DERIVATION, ...) is --
 * so it belongs among the true sense-to-sense kinds here, not among
 * LexicalRelationshipType's word-level ones.
 *
 * `TOPIC_DOMAIN` is deliberately absent -- it was already retired from
 * LexicalRelationshipType's own edge model before this split (WordSeeder's
 * own tagTopicDomain writes Sense.domainTag/relatedDomainTags directly
 * instead, lexical_relationship_type.ts's own TOPIC_DOMAIN docstring),
 * the same "an attribute on the Sense, not an edge between two Senses"
 * treatment this whole split now extends to everything else -- adding it
 * back here would be a regression, not a migration.
 *
 * No group/category/item bit-packing here, unlike LexicalRelationshipType --
 * that scheme exists there to distinguish Morphological from Orthographic
 * within one enum; every member here is already the same one group
 * (semantic), so a flat numbering is enough. Values start at 0, not
 * carried over from LexicalRelationshipType's own group-1 numeric range
 * (64+) -- those numbers encoded a "group 1" tag this enum no longer
 * needs to carry. */
export enum SemanticRelationshipKind {
  SYNONYM = 0,
  ANTONYM = 1,
  SIMILAR_TO = 2,
  HYPERNYM = 3,
  HYPONYM = 4,
  MERONYM = 5,
  HOLONYM = 6,
  TROPONYM = 7,
  ENTAILMENT = 8,
  CAUSE = 9,
  RELATED = 10,
  ALSO_SEE = 11,
  VERB_GROUP = 12,
  ATTRIBUTE = 13,
  REGION_DOMAIN = 14,
  USAGE_DOMAIN = 15,
  PERTAINYM = 16,
}

// SemanticRelationship's own MERONYM_KIND_QUALIFIER-style qualifier --
// MERONYM's own docstring (lexical_relationship_type.ts) has the full
// "one kind, three real-world distinctions" reasoning; unchanged by the
// relocation here.
export const SEMANTIC_MERONYM_KIND_QUALIFIER = "meronymKind";
export type SemanticMeronymKind = "part" | "member" | "substance";
