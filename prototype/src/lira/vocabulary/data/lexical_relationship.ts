import type { Identifier, Text } from "../../value_objects";
import type { LexicalRelationshipType, MeronymKindEnum } from "./enums/lexical_relationship_type";
import type { SourceReference } from "./source_reference";
import type { SystemPropertiesRef } from "./system_properties_ref";

/** A directed relationship between two WordForm+Sense pairs --
 * `SemanticRelationship`'s own exact counterpart (data/semantic_relationship.ts),
 * `sourceWordFormId`/`sourceSenseId`/`targetWordFormId`/`targetSenseId`
 * in place of `sourceSenseId`/`targetSenseId` alone. Matches
 * `word_wordform_sense_relationships.md`'s own target shape: "a lexical
 * WordForm affects, modifies, derives, specialises or changes the
 * interpretation or representation of another lexical sense" -- unlike
 * `MorphologicalPointerRelationship` (data/morphological_pointer_relationship.ts,
 * this interface's own former name and shape before this file was
 * freed up for the real, permanent version of this concept), this is a
 * permanent, queryable part of a Domain's own model
 * (`VocabularyContext.lexicalRelationships`), not seeding-internal
 * working state discarded after use.
 *
 * Named `source`/`target`, not the doc's own "Source"/"Destination" --
 * `SemanticRelationship`'s own exact convention, kept for consistency
 * (the doc's Source/Destination language is directional prose, not a
 * naming mandate).
 *
 * Populated at seed time by `role/word_seeder.ts`'s `copyLexicalRelationship()`
 * (every WordNet Morphological/Orthographic-group pointer) and
 * `role/relationship_seeder.ts`'s own parallel addition (the
 * hand-curated Common Relationship Cache's own morphological/
 * orthographic facts) -- both resolve `sourceWordFormId`/`targetWordFormId`
 * via `WordForms.registerBaseLemmaForm()` and `sourceSenseId`/`targetSenseId`
 * against the exact Sense the underlying fact is actually about, not a
 * guess. */
export interface LexicalRelationship {
  uuid: Identifier;
  version: Text;
  sourceWordFormId: Identifier;
  sourceSenseId: Identifier;
  targetWordFormId: Identifier;
  targetSenseId: Identifier;
  relationshipType: LexicalRelationshipType;
  sourceReferences: readonly SourceReference[];
  systemProperties: SystemPropertiesRef;

  inverseRelationshipType?: LexicalRelationshipType;
  // Which of WordNet's three part-whole pointer families (%p/%m/%s, or
  // their #p/#m/#s reciprocals) produced this edge, set only when
  // `relationshipType` is MERONYM and only for a WordNet-seeded fact --
  // MeronymKindEnum's own docstring (enums/lexical_relationship_type.ts).
  meronymKind?: MeronymKindEnum;
}
