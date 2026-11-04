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
 * │ Module Name     │ lira/vocabulary/data/enums/holonym_root_word
 * │ Filename        │ holonym_root_word.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-12
 * │ Modified Date   │ 2026-08-31
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ HolonymRootWord: numeric codes for the holonym root words.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/enums/holonym_root_word
 * @file holonym_root_word.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** Values are numeric codes, the same convention PartOfSpeech/
 * EditorialLabel already use.
 *
 * The Holonym-Root-Word column of the Interrogative/Hypernym/Holonym/
 * Vector-Primitive root word table -- the whole each row's Hypernym is
 * a part of (an Entity within a System, a Place within a Domain, and
 * so on). Members share InterrogativeRootWord's own numeric values
 * one-for-one -- see that enum's own docstring. No Python equivalent --
 * new to this table, prototype only. */
export enum HolonymRootWord {
  SYSTEM = 0,
  SOCIETY = 1,
  DOMAIN = 2,
  TIMELINE = 3,
  DISCOURSE = 4,
  // Seeded as "work" (root_words.json), not "framework" -- renamed so
  // the Holonym root word for the How/Operation row is a genuine
  // derivable noun (Word.isDerivableNoun's own docstring), which
  // "framework" never was.
  WORK = 5,
}
