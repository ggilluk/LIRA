import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import { createWord } from "../word_processor";
import type { Numeral } from "../../data/entities/numeral";

export type NumeralInit = Pick<Numeral, "text"> & Partial<Omit<Numeral, "text" | "partOfSpeech">>;

export function createNumeral(init: NumeralInit): Numeral {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.NUMERAL }) as Numeral;
}

export function isNumeral(word: Word): word is Numeral {
  return word.partOfSpeech === PartOfSpeech.NUMERAL;
}
