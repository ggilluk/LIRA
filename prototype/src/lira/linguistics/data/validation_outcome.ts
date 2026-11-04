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
 * │ Module Name     │ lira/linguistics/data/validation_outcome
 * │ Filename        │ validation_outcome.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-11
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ ValidationOutcome: the VALID / INVALID / UNRESOLVED result every
 * │                 │ Phrase, Clause and Sentence carries.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/data/validation_outcome
 * @file validation_outcome.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** The three-way validation result every Phrase/Clause/Sentence carries
 * (Linguistics Layer developer specification, 8.4; spec 20). UNRESOLVED
 * is distinct from INVALID: UNRESOLVED means sequencing could not reach
 * a conclusion (an unknown word blocked a required slot, spec 7), while
 * INVALID means sequencing reached a definite negative conclusion (e.g.
 * no finite predicate, spec 20's own "The fox over the dog." example).
 * ReadingScorer's rankKey orders VALID above UNRESOLVED above INVALID.
 *
 * Ported from linguistics/data/validation_outcome.py. */
export enum ValidationOutcome {
  INVALID = 0,
  UNRESOLVED = 1,
  VALID = 2,
}
