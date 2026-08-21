import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import { createWord } from "../word_processor";
import type { Preposition } from "../../data/entities/preposition";

export type PrepositionInit = Pick<Preposition, "text"> & Partial<Omit<Preposition, "text" | "partOfSpeech">>;

export function createPreposition(init: PrepositionInit): Preposition {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.PREPOSITION }) as Preposition;
}

export function isPreposition(word: Word): word is Preposition {
  return word.partOfSpeech === PartOfSpeech.PREPOSITION;
}
