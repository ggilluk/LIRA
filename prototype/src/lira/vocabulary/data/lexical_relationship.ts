import type { Identifier, Text } from "../../value_objects";
import type { AttributeValue } from "./attribute_value";
import type { LexicalRelationshipType } from "./enums/lexical_relationship_type";
import type { SourceReference } from "./source_reference";
import type { SystemPropertiesRef } from "./system_properties_ref";

/** A directed relationship between two Word entries. Matches the
 * Vocabulary Layer developer specification, 5. Ported from
 * vocabulary/data/lexical_relationship.py. */
export interface LexicalRelationship {
  uuid: Identifier;
  version: Text;
  sourceWordId: Identifier;
  targetWordId: Identifier;
  relationshipType: LexicalRelationshipType;
  sourceReferences: readonly SourceReference[];
  systemProperties: SystemPropertiesRef;

  inverseRelationshipType?: LexicalRelationshipType;
  qualifiers: readonly AttributeValue[];
}
