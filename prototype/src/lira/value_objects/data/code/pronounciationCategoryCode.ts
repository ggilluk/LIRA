import type { Code } from "../code";
import { IPACategoryCodelist } from "../enum/pronounciationCategoryCodelist";

/** Pronunciation category Code using the major sections of the IPA chart. */
export class PronounciationCategoryCode implements Code {
  readonly value: IPACategoryCodelist;
  readonly listName = "International Phonetic Alphabet - Categories";
  readonly listAgencyId = "ZZZ";
  readonly listAgencyName = "International Phonetic Association";

  constructor(value: IPACategoryCodelist) {
    this.value = value;
  }
}
