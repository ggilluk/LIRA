/** Interjection: Word's own INTERJECTION-specific subtype. The Word
 * Form to Part of Speech Matrix (../word_form_part_of_speech_matrix.md)
 * ticks only Base Lemma Canonical Form for this part of speech --
 * already Word.baseLemmaCanonicalForm's own field, shared by every
 * subtype -- so this class carries no field of its own beyond that; it
 * exists purely so a caller can narrow a Word to "definitely an
 * interjection" at the type level, the same as its siblings. */

import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "../word";

export interface Interjection extends Word {
  partOfSpeech: PartOfSpeech.INTERJECTION;
}
