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
 * │ Module Name     │ lira/value_objects/data/enum/languageStyleCodelist
 * │ Filename        │ languageStyleCodelist.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-31
 * │ Modified Date   │ 2026-08-31
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ LanguageStyleCodelist: LIRA's register/style codes (formal,
 * │                 │ informal, slang, ...).
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/enum/languageStyleCodelist
 * @file languageStyleCodelist.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/**
 * LIRA code values for a text's own register/style of language use --
 * how formal, technical, or colloquial a specific wording is.
 *
 * String values are used because UN/CEFACT CCTS Code. Content is a
 * character string. There is no external standard code list for
 * register/style (unlike ISO 639-1 language or ISO 15924 script), so
 * this is a LIRA code list, the same status PronounciationCategoryCodelist
 * (this same folder) has for IPA chart sections.
 */
export enum LanguageStyleCodelist {
  FORMAL = "FORMAL",
  INFORMAL = "INFORMAL",
  SLANG = "SLANG",
  TECHNICAL = "TECHNICAL",
  LITERARY = "LITERARY",
  COLLOQUIAL = "COLLOQUIAL",
  VULGAR = "VULGAR",
  NEUTRAL = "NEUTRAL",
}
