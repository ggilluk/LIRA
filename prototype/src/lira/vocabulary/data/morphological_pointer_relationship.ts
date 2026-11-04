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
 * │ Module Name     │ lira/vocabulary/data/morphological_pointer_relationship
 * │ Filename        │ morphological_pointer_relationship.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-09-05
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ MorphologicalPointerRelationship: a directed relationship
 * │                 │ between two Words.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/morphological_pointer_relationship
 * @file morphological_pointer_relationship.ts
 * @author Gurpinder Gill
 * @license MIT
 */
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
