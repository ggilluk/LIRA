/** Conjunction: Word's own CONJUNCTION-specific subtype. The Word Form
 * to Part of Speech Matrix (data/word_form_part_of_speech_matrix.md)
 * ticks only Base Lemma Canonical Form for this part of speech --
 * already Word.baseLemmaCanonicalForm's own field, shared by every
 * subtype -- so this class carries no field of its own beyond that; it
 * exists purely so a caller can narrow a Word to "definitely a
 * conjunction" at the type level, the same as its siblings. */

import { PartOfSpeech } from "./part_of_speech";
import { createWord, type Word } from "./word";

export interface Conjunction extends Word {
  partOfSpeech: PartOfSpeech.CONJUNCTION;
}

export type ConjunctionInit = Pick<Conjunction, "text"> & Partial<Omit<Conjunction, "text" | "partOfSpeech">>;

export function createConjunction(init: ConjunctionInit): Conjunction {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.CONJUNCTION }) as Conjunction;
}

export function isConjunction(word: Word): word is Conjunction {
  return word.partOfSpeech === PartOfSpeech.CONJUNCTION;
}
