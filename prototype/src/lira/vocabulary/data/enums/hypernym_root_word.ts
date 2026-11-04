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
 * │ Module Name     │ lira/vocabulary/data/enums/hypernym_root_word
 * │ Filename        │ hypernym_root_word.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-12
 * │ Modified Date   │ 2026-08-31
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ HypernymRootWord: numeric codes for the hypernym root words.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/enums/hypernym_root_word
 * @file hypernym_root_word.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** Values are numeric codes, the same convention PartOfSpeech/
 * EditorialLabel already use.
 *
 * The Hypernym-Root-Word column of the Interrogative/Hypernym/Holonym/
 * Vector-Primitive root word table -- the broadest category each
 * interrogative word's answer falls under (what a "what" is asking
 * about, a "who" is asking about, and so on). Members share
 * InterrogativeRootWord's own numeric values one-for-one -- see that
 * enum's own docstring. No Python equivalent -- new to this table,
 * prototype only. */
export enum HypernymRootWord {
  ENTITY = 0,
  PARTY_ROLE = 1,
  PLACE = 2,
  TIME = 3,
  REASON = 4,
  OPERATION = 5,
}
