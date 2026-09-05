import type { Identifier, Text } from "../../value_objects";
import type { LexicalRelationshipType, MeronymKindEnum } from "./enums/lexical_relationship_type";
import type { SourceReference } from "./source_reference";
import type { SystemPropertiesRef } from "./system_properties_ref";

/** A directed relationship between two Word entries. Matches the
 * Vocabulary Layer developer specification, 5. Ported from
 * vocabulary/data/lexical_relationship.py. */
export interface MorphologicalPointerRelationship {
  uuid: Identifier;
  version: Text;
  sourceWordId: Identifier;
  targetWordId: Identifier;
  relationshipType: LexicalRelationshipType;
  sourceReferences: readonly SourceReference[];
  systemProperties: SystemPropertiesRef;

  inverseRelationshipType?: LexicalRelationshipType;
  // LexicalRelationship's own identical field (data/lexical_relationship.ts's
  // own docstring) -- which of WordNet's three part-whole pointer
  // families produced this edge, set only for a WordNet-seeded MERONYM
  // fact.
  meronymKind?: MeronymKindEnum;
}
