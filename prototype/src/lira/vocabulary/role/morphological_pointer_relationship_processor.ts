import type { MorphologicalPointerRelationship } from "../data/morphological_pointer_relationship";
import type { MorphologicalPointerRelationshipStore } from "../data/morphological_pointer_relationship_store";
import type { MorphologicalPointerRelationshipSystemPropertyTensor } from "../data/morphological_pointer_relationship_tensor";
import type { LexicalRelationshipType, MeronymKindEnum } from "../data/enums/lexical_relationship_type";
import type { SourceReference } from "../data/source_reference";
import { SystemPropertiesRef } from "../data/system_properties_ref";

/** Creates MorphologicalPointerRelationship records, allocating each one's
 * tensor-backed SystemPropertiesRef row (Design Principle 8) and
 * storing the result in a MorphologicalPointerRelationshipStore.
 *
 * Ported from vocabulary/role/morphological_pointer_relationship_processor.py. */
export class MorphologicalPointerRelationshipProcessor {
  constructor(
    private readonly store: MorphologicalPointerRelationshipStore,
    private readonly tensor: MorphologicalPointerRelationshipSystemPropertyTensor,
  ) {}

  create(options: {
    sourceWordId: string;
    targetWordId: string;
    relationshipType: LexicalRelationshipType;
    sourceReferences: readonly SourceReference[];
    inverseRelationshipType?: LexicalRelationshipType;
    meronymKind?: MeronymKindEnum;
    confidence?: number;
    provenance?: number;
    temporal?: number;
    activation?: number;
  }): MorphologicalPointerRelationship {
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
    const relationship: MorphologicalPointerRelationship = {
      uuid: { value: relationshipUuid },
      version: { value: version },
      sourceWordId: { value: options.sourceWordId },
      targetWordId: { value: options.targetWordId },
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
