/** Interjection: Word's own INTERJECTION-specific subtype. The Word
 * Form to Part of Speech Matrix (data/word_form_part_of_speech_matrix.md)
 * ticks only Base Lemma Canonical Form for this part of speech --
 * already Word.baseLemmaCanonicalForm's own field, shared by every
 * subtype -- so this class carries no field of its own beyond that; it
 * exists purely so a caller can narrow a Word to "definitely an
 * interjection" at the type level, the same as its siblings. */

import { PartOfSpeech } from "./part_of_speech";
import { createWord, type Word } from "./word";

export interface Interjection extends Word {
  partOfSpeech: PartOfSpeech.INTERJECTION;
}

export type InterjectionInit = Pick<Interjection, "text"> & Partial<Omit<Interjection, "text" | "partOfSpeech">>;

export function createInterjection(init: InterjectionInit): Interjection {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.INTERJECTION }) as Interjection;
}

export function isInterjection(word: Word): word is Interjection {
  return word.partOfSpeech === PartOfSpeech.INTERJECTION;
}
