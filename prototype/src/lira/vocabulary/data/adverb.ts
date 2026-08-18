/** Adverb: Word's own ADVERB-specific subtype. Unlike Noun/Verb/
 * Adjective, neither Princeton WordNet's dict/data.adv nor the Common
 * Vocabulary Cache carries any adverb-specific marker this codebase
 * discards today (Verb's `frames`/Adjective's `syntacticPosition`
 * docstrings on where those two came from), so every field below is
 * undefined until a future seeding/curation pass populates it -- the
 * class still exists, and still carries its own row of fields from the
 * Word Form to Part of Speech Matrix
 * (data/word_form_part_of_speech_matrix.md), the same as its three
 * siblings, ready for a value once one is available. */

import type { Text } from "../../value_objects";
import { PartOfSpeech } from "./part_of_speech";
import { createWord, type Word } from "./word";

export interface Adverb extends Word {
  partOfSpeech: PartOfSpeech.ADVERB;

  // The purpose is to identify the basic adjective or adverb form that
  // describes a quality without comparing it with another.
  positiveDegreeForm?: Text;
  // The purpose is to identify the adjective or adverb form used to
  // compare the degree of a quality between two people, things,
  // actions, or states. Applies only to gradable adverbs ("faster"),
  // not to every adverb.
  comparativeDegreeForm?: Text;
  // The purpose is to identify the adjective or adverb form used to
  // identify the highest or lowest degree of a quality within a group.
  // Same gradable-only caveat as comparativeDegreeForm above.
  superlativeDegreeForm?: Text;
}

export type AdverbInit = Pick<Adverb, "text"> & Partial<Omit<Adverb, "text" | "partOfSpeech">>;

export function createAdverb(init: AdverbInit): Adverb {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.ADVERB }) as Adverb;
}

export function isAdverb(word: Word): word is Adverb {
  return word.partOfSpeech === PartOfSpeech.ADVERB;
}
