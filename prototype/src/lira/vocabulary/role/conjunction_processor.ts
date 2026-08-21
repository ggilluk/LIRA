import { PartOfSpeech } from "../data/enums/part_of_speech";
import { createWord, type Word } from "../data/word";
import type { Conjunction } from "../data/entities/conjunction";

export type ConjunctionInit = Pick<Conjunction, "text"> & Partial<Omit<Conjunction, "text" | "partOfSpeech">>;

export function createConjunction(init: ConjunctionInit): Conjunction {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.CONJUNCTION }) as Conjunction;
}

export function isConjunction(word: Word): word is Conjunction {
  return word.partOfSpeech === PartOfSpeech.CONJUNCTION;
}
