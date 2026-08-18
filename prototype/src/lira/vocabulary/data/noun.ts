/** Noun: Word's own NOUN-specific subtype. `isCountable` has no
 * seeding source today -- neither Princeton WordNet's dict/ files nor
 * the Common Vocabulary Cache mark countability anywhere -- so it stays
 * undefined on every Noun WordSeeder produces; the field exists so a
 * future curation pass has somewhere to write "chair" (countable) vs.
 * "water" (uncountable) to, the same "declared before it's populated"
 * shape seededPleasureDispleasureWeight and its siblings already have
 * on Word itself. */

import { PartOfSpeech } from "./part_of_speech";
import { createWord, type Word } from "./word";

export interface Noun extends Word {
  partOfSpeech: PartOfSpeech.NOUN;
  isCountable?: boolean;
}

export type NounInit = Pick<Noun, "text"> & Partial<Omit<Noun, "text" | "partOfSpeech">>;

export function createNoun(init: NounInit): Noun {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.NOUN }) as Noun;
}

export function isNoun(word: Word): word is Noun {
  return word.partOfSpeech === PartOfSpeech.NOUN;
}
