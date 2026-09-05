import type { AttributeValue } from "../data/attribute_value";
import type { SemanticRelationshipKind } from "../data/enums/semantic_relationship_kind";
import type { SemanticRelationship } from "../data/semantic_relationship";
import type { SemanticRelationshipSystemPropertyTensor } from "../data/semantic_relationship_tensor";
import type { SemanticRelationshipStore } from "../data/semantic_relationship_store";
import type { SourceReference } from "../data/source_reference";
import { SystemPropertiesRef } from "../data/system_properties_ref";

/** Creates SemanticRelationship records -- LexicalRelationshipProcessor's
 * own exact counterpart (role/lexical_relationship_processor.ts),
 * sourceSenseId/targetSenseId in place of sourceWordId/targetWordId. */
export class SemanticRelationshipProcessor {
  constructor(
    private readonly store: SemanticRelationshipStore,
    private readonly tensor: SemanticRelationshipSystemPropertyTensor,
  ) {}

  create(options: {
    sourceSenseId: string;
    targetSenseId: string;
    relationshipType: SemanticRelationshipKind;
    sourceReferences: readonly SourceReference[];
    inverseRelationshipType?: SemanticRelationshipKind;
    qualifiers?: readonly AttributeValue[];
    confidence?: number;
    provenance?: number;
    temporal?: number;
    activation?: number;
  }): SemanticRelationship {
    const relationshipUuid = crypto.randomUUID();
    const version = "1.0";
    const row = this.tensor.allocateRow(
      relationshipUuid,
      version,
      options.confidence ?? 0.0,
      options.provenance ?? 0.0,
      options.temporal ?? 0.0,
      options.activation ?? 0.0,
    );
    const relationship: SemanticRelationship = {
      uuid: { value: relationshipUuid },
      version: { value: version },
      sourceSenseId: { value: options.sourceSenseId },
      targetSenseId: { value: options.targetSenseId },
      relationshipType: options.relationshipType,
      sourceReferences: options.sourceReferences,
      systemProperties: new SystemPropertiesRef(this.tensor, row),
      inverseRelationshipType: options.inverseRelationshipType,
      qualifiers: options.qualifiers ?? [],
    };
    this.store.add(relationship);
    return relationship;
  }
}
