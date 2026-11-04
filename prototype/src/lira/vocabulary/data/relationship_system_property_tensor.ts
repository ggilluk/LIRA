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
 * │ Module Name     │ lira/vocabulary/data/relationship_system_property_tensor
 * │ Filename        │ relationship_system_property_tensor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-20
 * │ Modified Date   │ 2026-08-20
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ RelationshipSystemPropertyTensor: the shape shared by every
 * │                 │ relationship system-property tensor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/relationship_system_property_tensor
 * @file relationship_system_property_tensor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** The shared shape SystemPropertiesRef needs from a system-properties
 * tensor -- LexicalRelationshipSystemPropertyTensor and
 * SemanticRelationshipSystemPropertyTensor (data/lexical_relationship_tensor.ts,
 * data/semantic_relationship_tensor.ts) both satisfy this structurally,
 * so one SystemPropertiesRef class serves either row kind without
 * needing to know which. Column layout (confidence/provenance/temporal/
 * activation, in that order) is a convention both tensors share, not
 * enforced by this interface itself. */
export interface RelationshipSystemPropertyTensor {
  uuidOf(row: number): string;
  versionOf(row: number): string;
  getCell(row: number, col: number): number;
  setCell(row: number, col: number, value: number): void;
}
