import type { Code } from "../code";
import { PronounciationCodelist } from "../enum/pronounciationCodelist";
import { PronounciationCategoryCodelist } from "../enum/pronounciationCategoryCodelist";

/** Pronunciation Code using the International Phonetic Alphabet. */
export class PronounciationCode implements Code {
  readonly value: PronounciationCodelist;
  readonly category: PronounciationCategoryCodelist;
  readonly ipaNumber?: string;
  readonly unicodeCodePoints: string[];
  readonly unicodeNames: string[];
  readonly listName = "International Phonetic Alphabet";
  readonly listAgencyId = "ZZZ";
  readonly listAgencyName = "International Phonetic Association";

  constructor(value: PronounciationCodelist, category: PronounciationCategoryCodelist, unicodeCodePoints: string[] = [], unicodeNames: string[] = [], ipaNumber?: string) {
    this.value = value;
    this.category = category;
    this.unicodeCodePoints = unicodeCodePoints;
    this.unicodeNames = unicodeNames;
    this.ipaNumber = ipaNumber;
  }
}
