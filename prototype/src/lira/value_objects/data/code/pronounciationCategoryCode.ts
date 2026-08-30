import type { Code } from "../code";
import { PronounciationCategoryCodelist } from "../enum/pronounciationCategoryCodelist";

/** Pronunciation category Code using the major sections of the IPA chart. */
export class PronounciationCategoryCode implements Code {
  readonly value: PronounciationCategoryCodelist;
  readonly listName = "International Phonetic Alphabet - Categories";
  readonly listAgencyId = "ZZZ";
  readonly listAgencyName = "International Phonetic Association";

  constructor(value: PronounciationCategoryCodelist) {
    this.value = value;
  }
}
