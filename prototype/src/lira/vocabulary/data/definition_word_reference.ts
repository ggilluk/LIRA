import type { Word } from "./entities/word";

/** One token from a Word's own `definition` text, resolved against a
 * Dictionary -- the result of breaking a definition down into its own
 * sequenced array of words (`definitionWords()` in role/word_processor.ts).
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
