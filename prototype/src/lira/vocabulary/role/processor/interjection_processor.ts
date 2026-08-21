import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { createWord, type Word } from "../../data/word";
import type { Interjection } from "../../data/entities/interjection";

export type InterjectionInit = Pick<Interjection, "text"> & Partial<Omit<Interjection, "text" | "partOfSpeech">>;

export function createInterjection(init: InterjectionInit): Interjection {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.INTERJECTION }) as Interjection;
}

export function isInterjection(word: Word): word is Interjection {
  return word.partOfSpeech === PartOfSpeech.INTERJECTION;
}
