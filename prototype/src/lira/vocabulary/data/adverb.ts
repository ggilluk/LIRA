/** Adverb: Word's own ADVERB-specific subtype. No additional field of
 * its own yet -- unlike Noun/Verb/Adjective, neither Princeton WordNet's
 * dict/data.adv nor the Common Vocabulary Cache carries any adverb-
 * specific marker this codebase currently discards (Verb's `frames`/
 * Adjective's `syntacticPosition` docstrings on where those two came
 * from). This class exists purely so a caller can narrow a Word to
 * "definitely an adverb" at the type level, the same as its three
 * siblings, ready for a field to be added here if a future WordNet
 * release or curation pass ever supplies one. */

import { PartOfSpeech } from "./part_of_speech";
import { createWord, type Word } from "./word";

export interface Adverb extends Word {
  partOfSpeech: PartOfSpeech.ADVERB;
}

export type AdverbInit = Pick<Adverb, "text"> & Partial<Omit<Adverb, "text" | "partOfSpeech">>;

export function createAdverb(init: AdverbInit): Adverb {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.ADVERB }) as Adverb;
}

export function isAdverb(word: Word): word is Adverb {
  return word.partOfSpeech === PartOfSpeech.ADVERB;
}
