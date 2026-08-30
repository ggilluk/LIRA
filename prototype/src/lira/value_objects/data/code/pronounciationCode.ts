import type { Code } from "../code";
import { IPACode } from "../enum/pronounciationCode";
import { IPACategoryCode } from "../enum/pronounciationCategoryCode";

/**
 * Pronunciation Code using the International Phonetic Alphabet.
 *
 * The code-list metadata belongs to the pronunciation code value itself.
 */
export class PronounciationCode implements Code {
  readonly value: IPACode;
  readonly category: IPACategoryCode;
  readonly ipaNumber?: string;
  readonly unicodeCodePoints: string[];
  readonly unicodeNames: string[];

  readonly listName = "International Phonetic Alphabet";
  readonly listAgencyId = "ZZZ";
  readonly listAgencyName = "International Phonetic Association";

  constructor(
    value: IPACode,
    category: IPACategoryCode,
    unicodeCodePoints: string[] = [],
    unicodeNames: string[] = [],
    ipaNumber?: string,
  ) {
    this.value = value;
    this.category = category;
    this.unicodeCodePoints = unicodeCodePoints;
    this.unicodeNames = unicodeNames;
    this.ipaNumber = ipaNumber;
  }
}
