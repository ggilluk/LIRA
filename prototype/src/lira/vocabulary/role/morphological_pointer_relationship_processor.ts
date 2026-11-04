/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/vocabulary/role/morphological_pointer_relationship_processor
 * │ Filename        │ morphological_pointer_relationship_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-09-05
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ MorphologicalPointerRelationshipProcessor: creates
 * │                 │ MorphologicalPointerRelationship records and their tensor rows.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/role/morphological_pointer_relationship_processor
 * @file morphological_pointer_relationship_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
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
