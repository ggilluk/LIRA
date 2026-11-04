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
 * │ Module Name     │ lira/linguistics/data/phrase_type
 * │ Filename        │ phrase_type.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-09-08
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ PhraseType: the phrase types the read path can produce.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/data/phrase_type
 * @file phrase_type.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** The phrase types Phrase.read() can produce (Linguistics Layer
 * developer specification, 4.1). Integer-valued, sequentially assigned,
 * for the same tensor-code convention LinguisticUnitKind/PartOfSpeech
 * already use.
 *
 * Relative-clause and coordinated-clause detection route through
 * ClauseType instead -- a coordinated PHRASE (e.g. "John and Mary") is
 * still one of the five types below with a coordination scope layered on
 * top, not a sixth type.
 *
 * Ported from linguistics/data/phrase_type.py. */
export enum PhraseType {
  NOUN_PHRASE = 0,
  VERB_PHRASE = 1,
  ADJECTIVE_PHRASE = 2,
  ADVERB_PHRASE = 3,
  PREPOSITIONAL_PHRASE = 4,
}
