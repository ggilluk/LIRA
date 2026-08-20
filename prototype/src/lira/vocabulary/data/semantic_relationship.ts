import type { Identifier, Text } from "../../value_objects";
import type { AttributeValue } from "./attribute_value";
import type { SemanticRelationshipKind } from "./enums/semantic_relationship_kind";
import type { SourceReference } from "./source_reference";
import type { SystemPropertiesRef } from "./system_properties_ref";

/** A directed relationship between two Senses -- LexicalRelationship's
 * own exact counterpart (data/lexical_relationship.ts), sourceSenseId/
 * targetSenseId in place of sourceWordId/targetWordId. The true
 * sense-to-sense semantic facts (SemanticRelationshipKind's own
 * docstring on why these moved out of LexicalRelationshipType's former
 * "Lexical Semantic" group) -- never a Word or Phrase on either side. */
export interface SemanticRelationship {
  uuid: Identifier;
  version: Text;
  sourceSenseId: Identifier;
  targetSenseId: Identifier;
  relationshipType: SemanticRelationshipKind;
  sourceReferences: readonly SourceReference[];
  systemProperties: SystemPropertiesRef;

  inverseRelationshipType?: SemanticRelationshipKind;
  qualifiers: readonly AttributeValue[];
}
