/** Determiner: Word's own DETERMINER-specific subtype. Every field
 * below is undefined until a seeding/curation pass populates it -- the
 * Common Vocabulary Cache's own determiners.json entries
 * (word_seeder.ts's own entryToWord()) don't set any of them today, the
 * same "declared before it's populated" shape Noun.isCountable and its
 * siblings already have. */

import type { Text } from "../../value_objects";
import { PartOfSpeech } from "./part_of_speech";
import { createWord, type Word } from "./word";

export interface Determiner extends Word {
  partOfSpeech: PartOfSpeech.DETERMINER;

  // The purpose is to identify the word form used when referring to
  // one person, thing, place, or idea. Applies only to a subset of
  // determiners -- "this"/"that" have a singular/plural pair ("this" /
  // "these"), but "the"/"a" do not vary by number at all. Fully
  // lexical, not spelling-derivable (the matrix's own Format/String
  // Pattern rows are both `N/A`) -- a populated value's own
  // `Text.formats` should stay unset.
  singularNumberForm?: Text;
  // The purpose is to identify the word form used when referring to
  // more than one person, thing, place, or idea. Same subset-only
  // caveat, and same fully-lexical/no-`formats` note, as
  // singularNumberForm above.
  pluralNumberForm?: Text;
  // The purpose is to identify the noun, pronoun, or determiner form
  // used to show that something belongs or relates to a person or
  // thing. Applies only to a subset of determiners -- the possessive
  // determiners ("my", "your", "their", ...), not "the"/"a"/"this".
  // Rule #3 is this class's own case -- a closed fixed-word lookup
  // (`/^(my|mine|your|yours|his|her|hers|its|our|ours|their|theirs)$/i`)
  // -- a populated value's own `Text.formats` should carry it. Rules
  // #1-2 (an apostrophe rule for an existing plural) are Noun's own
  // case, not applicable here.
  possessiveCaseForm?: Text;
}

export type DeterminerInit = Pick<Determiner, "text"> & Partial<Omit<Determiner, "text" | "partOfSpeech">>;

export function createDeterminer(init: DeterminerInit): Determiner {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.DETERMINER }) as Determiner;
}

export function isDeterminer(word: Word): word is Determiner {
  return word.partOfSpeech === PartOfSpeech.DETERMINER;
}
