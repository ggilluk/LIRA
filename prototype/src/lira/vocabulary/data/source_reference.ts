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
 * │ Module Name     │ lira/vocabulary/data/source_reference
 * │ Filename        │ source_reference.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-10-06
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ SourceReference: provenance for a Dictionary, Word or
 * │                 │ relationship.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/source_reference
 * @file source_reference.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Identifier, Text, Uri } from "../../value_objects";

/** Provenance for a Dictionary, Word, or LexicalRelationship. Matches
 * the Vocabulary Layer developer specification, 7.2. Ported from
 * vocabulary/data/source_reference.py, except `referenceUri`:
 * `Identifier` there (Python's own `reference_uri: Optional[Identifier]`),
 * `Uri` here (value_objects/data/uri.ts) -- a real, format-checked
 * address, `Code.listUri`/`Identifier.schemeUri`'s own reasoning for
 * switching, applied to this field too. */
export interface SourceReference {
  sourceName: Text;
  sourceVersion?: Text;
  externalIdentifier?: Identifier;
  referenceUri?: Uri;
  licenceIdentifier?: Identifier;
}
