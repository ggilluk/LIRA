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
 * │ Module Name     │ lira/vocabulary/data/definition_word_reference
 * │ Filename        │ definition_word_reference.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-09-11
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ DefinitionWordReference: one token of a Word's definition,
 * │                 │ resolved against the Dictionary.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/definition_word_reference
 * @file definition_word_reference.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Word } from "./entities/word";

/** One token from a Word's own `definition` text, resolved against a
 * Dictionary -- the result of breaking a definition down into its own
 * sequenced array of words (`recogniseDefinitionWords()` in role/processor/word_processor.ts).
 * Deliberately not a `Word` field (Design Principle 4: "A Word must
 * not contain collections of related words") -- computed on demand.
 *
 * Ported from vocabulary/data/definition_word_reference.py. */
export interface DefinitionWordReference {
  // The raw token as it appeared in the definition text, casing
  // preserved -- not necessarily equal to `word.text`.
  text: string;

  // undefined means the Dictionary this reference was resolved against
  // has no Word at all for this token -- reported, not guessed.
  word?: Word;
}

export function isResolved(reference: DefinitionWordReference): boolean {
  return reference.word !== undefined;
}
