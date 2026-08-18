/** Preposition: Word's own PREPOSITION-specific subtype. The Word Form
 * to Part of Speech Matrix (data/word_form_part_of_speech_matrix.md)
 * ticks only Base Lemma Canonical Form for this part of speech --
 * already Word.baseLemmaCanonicalForm's own field, shared by every
 * subtype -- so this class carries no field of its own beyond that; it
 * exists purely so a caller can narrow a Word to "definitely a
 * preposition" at the type level, the same as its siblings. */

import { PartOfSpeech } from "./part_of_speech";
import { createWord, type Word } from "./word";

export interface Preposition extends Word {
  partOfSpeech: PartOfSpeech.PREPOSITION;
}

export type PrepositionInit = Pick<Preposition, "text"> & Partial<Omit<Preposition, "text" | "partOfSpeech">>;

export function createPreposition(init: PrepositionInit): Preposition {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.PREPOSITION }) as Preposition;
}

export function isPreposition(word: Word): word is Preposition {
  return word.partOfSpeech === PartOfSpeech.PREPOSITION;
}
