/** Noun: Word's own NOUN-specific subtype. `isCountable` has no
 * seeding source today -- neither Princeton WordNet's dict/ files nor
 * the Common Vocabulary Cache mark countability anywhere -- so it stays
 * undefined on every Noun WordSeeder produces; the field exists so a
 * future curation pass has somewhere to write "chair" (countable) vs.
 * "water" (uncountable) to, the same "declared before it's populated"
 * shape seededPleasureDispleasureWeight and its siblings already have
 * on Word itself.
 *
 * `singularNumberForm`/`pluralNumberForm`/`possessiveCaseForm` are this
 * subtype's own row of fields from the Word Form to Part of Speech
 * Matrix (data/word_form_part_of_speech_matrix.md) -- undefined until a
 * seeding/curation pass populates them, same as `isCountable`. */

import type { Text } from "../../value_objects";
import { PartOfSpeech } from "./enums/part_of_speech";
import { createWord, type Word } from "./word";

export interface Noun extends Word {
  partOfSpeech: PartOfSpeech.NOUN;
  isCountable?: boolean;

  // The purpose is to identify the word form used when referring to
  // one person, thing, place, or idea. Fully lexical, not spelling-
  // derivable (the matrix's own Format/String Pattern rows are both
  // `N/A`) -- a populated value's own `Text.formats` should stay unset.
  singularNumberForm?: Text;
  // The purpose is to identify the word form used when referring to
  // more than one person, thing, place, or idea. Regular-case spelling
  // rules #1-4 are regex-derivable (`/s$/i`, `/es$/i`, `/ies$/i`,
  // `/ves$/i`) -- a populated regular-case value's own `Text.formats`
  // should carry whichever of those matched; rules #5-6 (irregular /
  // unchanged, "child"->"children", "sheep"->"sheep") have no format at
  // all and need curated data instead.
  pluralNumberForm?: Text;
  // The purpose is to identify the noun, pronoun, or determiner form
  // used to show that something belongs or relates to a person or
  // thing. Rules #1-2 are regex-derivable (`/'s$/i`, `/s'$/i` for an
  // existing plural) -- a populated value's own `Text.formats` should
  // carry whichever matched. Rule #3 (an explicitly classified
  // possessive spelling) is Pronoun/Determiner's own case, not Noun's.
  possessiveCaseForm?: Text;
}

export type NounInit = Pick<Noun, "text"> & Partial<Omit<Noun, "text" | "partOfSpeech">>;

export function createNoun(init: NounInit): Noun {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.NOUN }) as Noun;
}

export function isNoun(word: Word): word is Noun {
  return word.partOfSpeech === PartOfSpeech.NOUN;
}
