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
 * │ Module Name     │ lira/vocabulary/data/enums/editorial_label
 * │ Filename        │ editorial_label.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-18
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ EditorialLabel: numeric editorial label codes for Words.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/enums/editorial_label
 * @file editorial_label.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** Values are numeric codes for use in a tensor, not string labels --
 * same convention as PartOfSpeech and LinguisticUnitKind.
 *
 * Matches the Vocabulary Layer developer specification, 6.6. Ported
 * from vocabulary/data/editorial_label.py. */
export enum EditorialLabel {
  ARCHAIC = 0,
  OBSOLETE = 1,
  RARE = 2,
  HISTORICAL = 3,
  OFFENSIVE = 4,
  DEPRECATED = 5,
  REGIONAL = 6,
  NONSTANDARD = 7,
}
