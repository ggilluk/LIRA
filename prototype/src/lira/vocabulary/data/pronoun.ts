/** Pronoun: Word's own PRONOUN-specific subtype -- the closed class
 * with the richest row of its own in the Word Form to Part of Speech
 * Matrix (data/word_form_part_of_speech_matrix.md), matching how much a
 * pronoun paradigm actually varies (I/me/my/mine/myself, he/him/his/
 * himself, ...) compared to every other closed class. Every field below
 * is undefined until a seeding/curation pass populates it -- the
 * Common Vocabulary Cache's own pronouns.json entries (word_seeder.ts's
 * own entryToWord()) don't set any of them today, the same "declared
 * before it's populated" shape Noun.isCountable and its siblings
 * already have. */

import type { Text } from "../../value_objects";
import { PartOfSpeech } from "./part_of_speech";
import { createWord, type Word } from "./word";

export interface Pronoun extends Word {
  partOfSpeech: PartOfSpeech.PRONOUN;

  // The purpose is to identify the word form used when referring to
  // one person, thing, place, or idea. Applies only to a subset of
  // pronouns -- "each other"/"one another" have no distinct singular
  // form of their own the way "I"/"we" do.
  singularNumberForm?: Text;
  // The purpose is to identify the word form used when referring to
  // more than one person, thing, place, or idea. Same subset-only
  // caveat as singularNumberForm above.
  pluralNumberForm?: Text;
  // The purpose is to identify the word form used when the speaker
  // refers to themselves or to a group that includes them. Applies
  // only to a subset of pronouns -- "who"/"which" have no person of
  // their own the way "I"/"we" do.
  firstPersonForm?: Text;
  // The purpose is to identify the word form used when referring to
  // the person or people being addressed. Same subset-only caveat as
  // firstPersonForm above.
  secondPersonForm?: Text;
  // The purpose is to identify the word form used when referring to a
  // person, thing, place, or idea other than the speaker or listener.
  // Same subset-only caveat as firstPersonForm above.
  thirdPersonForm?: Text;
  // The purpose is to identify the pronoun form used for the person or
  // thing performing or experiencing what the clause describes.
  subjectiveCaseForm?: Text;
  // The purpose is to identify the pronoun form used for the person or
  // thing affected by an action or following a preposition.
  objectiveCaseForm?: Text;
  // The purpose is to identify the noun, pronoun, or determiner form
  // used to show that something belongs or relates to a person or
  // thing.
  possessiveCaseForm?: Text;
  // The purpose is to identify the pronoun form used when a person or
  // thing refers back to itself, such as "myself" or "themselves".
  reflexiveCaseForm?: Text;
}

export type PronounInit = Pick<Pronoun, "text"> & Partial<Omit<Pronoun, "text" | "partOfSpeech">>;

export function createPronoun(init: PronounInit): Pronoun {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.PRONOUN }) as Pronoun;
}

export function isPronoun(word: Word): word is Pronoun {
  return word.partOfSpeech === PartOfSpeech.PRONOUN;
}
