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
 * │ Module Name     │ lira/value_objects/data/enum/pronounciationCategoryCodelist
 * │ Filename        │ pronounciationCategoryCodelist.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-30
 * │ Modified Date   │ 2026-08-30
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ PronounciationCategoryCodelist: the major sections of the IPA
 * │                 │ chart.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/enum/pronounciationCategoryCodelist
 * @file pronounciationCategoryCodelist.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/**
 * LIRA code values for the major sections of the official
 * International Phonetic Alphabet chart.
 *
 * String values are used because UN/CEFACT CCTS Code. Content is a
 * character string.
 */
export enum PronounciationCategoryCodelist {
  CONSONANT_PULMONIC = "CONSONANT_PULMONIC",
  CONSONANT_NON_PULMONIC = "CONSONANT_NON_PULMONIC",
  OTHER_SYMBOL = "OTHER_SYMBOL",
  VOWEL = "VOWEL",
  DIACRITIC = "DIACRITIC",
  SUPRASEGMENTAL = "SUPRASEGMENTAL",
  TONE_AND_WORD_ACCENT = "TONE_AND_WORD_ACCENT",
}
