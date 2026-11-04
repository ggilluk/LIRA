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
 * │ Module Name     │ lira/linguistics/data/linguistic_unit_kind
 * │ Filename        │ linguistic_unit_kind.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-12
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ LinguisticUnitKind: numeric unit-kind codes stored in the
 * │                 │ linguistic system-property tensor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/data/linguistic_unit_kind
 * @file linguistic_unit_kind.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** Values are the numeric codes this kind is stored as in
 * LinguisticSystemPropertyTensor (Rule 14) -- the numeric value is used
 * directly as the tensor cell, not just a label.
 *
 * Word and Punctuation are both Vocabulary's Word class at the type
 * level (a punctuation mark is a Word with partOfSpeech=PUNCTUATION,
 * not a separate class) -- GraphProcessor.materialiseToken still tags a
 * token's tensor row with the Punctuation kind rather than Word when
 * that's the case, derived from partOfSpeech instead of an instanceof
 * check.
 *
 * Ported from linguistics/data/linguistic_unit_kind.py. */
export enum LinguisticUnitKind {
  Word = 0,
  Punctuation = 1,
  Clause = 2,
  Sentence = 3,
  Paragraph = 4,
  // Renamed from Subject (prototype only -- see data/document.ts's own
  // docstring); same tensor slot, same underlying concept, so the
  // value stays 5 -- a rename is not a renumbering.
  Document = 5,
  UserPrompt = 6,
  // Appended, not inserted -- 0-6 above are already live tensor cell
  // codes in any LinguisticSystemPropertyTensor built before this value
  // existed; renumbering them would silently corrupt previously-
  // allocated rows' kindOf() reads.
  Phrase = 7,
  // Also appended, same reasoning -- new to this hierarchy (data/heading.ts).
  Heading = 8,
}
