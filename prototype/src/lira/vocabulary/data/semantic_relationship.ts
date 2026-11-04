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
 * │ Module Name     │ lira/vocabulary/data/semantic_relationship
 * │ Filename        │ semantic_relationship.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-20
 * │ Modified Date   │ 2026-09-05
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ SemanticRelationship: a directed relationship between two
 * │                 │ Senses.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/semantic_relationship
 * @file semantic_relationship.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Identifier, Text } from "../../value_objects";
import type { MeronymKindEnum } from "./enums/lexical_relationship_type";
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
  // LexicalRelationship's own identical field (data/lexical_relationship.ts's
  // own docstring) -- which of WordNet's three part-whole pointer
  // families produced this edge, set only for a WordNet-seeded MERONYM
  // fact.
  meronymKind?: MeronymKindEnum;
}
