import type { LexicalRelationship } from "../data/lexical_relationship";
import type { LexicalRelationshipStore } from "../data/lexical_relationship_store";
import type { LexicalRelationshipSystemPropertyTensor } from "../data/lexical_relationship_tensor";
import type { LexicalRelationshipType, MeronymKindEnum } from "../data/enums/lexical_relationship_type";
import type { SourceReference } from "../data/source_reference";
import { SystemPropertiesRef } from "../data/system_properties_ref";

/** Creates permanent LexicalRelationship records -- `SemanticRelationshipProcessor`'s
 * own exact counterpart (role/semantic_relationship_processor.ts),
 * `sourceWordFormId`/`sourceSenseId`/`targetWordFormId`/`targetSenseId`
 * in place of `sourceSenseId`/`targetSenseId` alone. */
export class LexicalRelationshipProcessor {
  constructor(
    private readonly store: LexicalRelationshipStore,
    private readonly tensor: LexicalRelationshipSystemPropertyTensor,
  ) {}

  create(options: {
    sourceWordFormId: string;
    sourceSenseId: string;
    targetWordFormId: string;
    targetSenseId: string;
    relationshipType: LexicalRelationshipType;
    sourceReferences: readonly SourceReference[];
    inverseRelationshipType?: LexicalRelationshipType;
    meronymKind?: MeronymKindEnum;
    confidence?: number;
    provenance?: number;
    temporal?: number;
    activation?: number;
  }): LexicalRelationship {
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
    const relationship: LexicalRelationship = {
      uuid: { value: relationshipUuid },
      version: { value: version },
      sourceWordFormId: { value: options.sourceWordFormId },
      sourceSenseId: { value: options.sourceSenseId },
      targetWordFormId: { value: options.targetWordFormId },
      targetSenseId: { value: options.targetSenseId },
      relationshipType: options.relationshipType,
      sourceReferences: options.sourceReferences,
      systemProperties: new SystemPropertiesRef(this.tensor, row),
      inverseRelationshipType: options.inverseRelationshipType,
      meronymKind: options.meronymKind,
    };
    this.store.add(relationship);
    return relationship;
  }
}
