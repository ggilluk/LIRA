import type { AttributeValue } from "../data/attribute_value";
import type { LexicalRelationship } from "../data/lexical_relationship";
import type { LexicalRelationshipStore } from "../data/lexical_relationship_store";
import type { LexicalRelationshipSystemPropertyTensor } from "../data/lexical_relationship_tensor";
import type { LexicalRelationshipType } from "../data/lexical_relationship_type";
import type { SourceReference } from "../data/source_reference";
import { SystemPropertiesRef } from "../data/system_properties_ref";
import { newUuid } from "../data/uuid";

/** Creates LexicalRelationship records, allocating each one's
 * tensor-backed SystemPropertiesRef row (Design Principle 8) and
 * storing the result in a LexicalRelationshipStore.
 *
 * Ported from vocabulary/role/lexical_relationship_processor.py. */
export class LexicalRelationshipProcessor {
  constructor(
    private readonly store: LexicalRelationshipStore,
    private readonly tensor: LexicalRelationshipSystemPropertyTensor,
  ) {}

  create(options: {
    sourceWordId: string;
    targetWordId: string;
    relationshipType: LexicalRelationshipType;
    sourceReferences: readonly SourceReference[];
    inverseRelationshipType?: LexicalRelationshipType;
    qualifiers?: readonly AttributeValue[];
    confidence?: number;
    provenance?: number;
    temporal?: number;
    activation?: number;
  }): LexicalRelationship {
    const relationshipUuid = newUuid();
    const version = "1.0";
    const row = this.tensor.allocateRow(
      relationshipUuid,
      version,
      options.confidence ?? 0.0,
      options.provenance ?? 0.0,
      options.temporal ?? 0.0,
      options.activation ?? 0.0,
    );
    const relationship: LexicalRelationship = {
      uuid: { value: relationshipUuid },
      version: { value: version },
      sourceWordId: { value: options.sourceWordId },
      targetWordId: { value: options.targetWordId },
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
