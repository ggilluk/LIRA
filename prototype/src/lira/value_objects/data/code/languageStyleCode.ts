import type { Code } from "../code";
import { LanguageStyleCodelist } from "../enum/languageStyleCodelist";

/**
 * UN/CEFACT CCTS Code. Type specialised for a text's own register/style
 * of language use.
 *
 * CCTS Code. Content is represented by `value`. The style code list is a
 * LIRA code list; no external standard exists for register/style, so no
 * UNCL 3055 agency identifier is asserted (PronounciationCategoryCode's
 * own identical reasoning, value_objects/data/code/pronounciationCategoryCode.ts).
 */
export class LanguageStyleCode implements Code {
  readonly value: LanguageStyleCodelist;

  readonly name?: string;
  readonly languageId?: string;
  readonly listId?: string;
  readonly listAgencyId?: string;
  readonly listAgencyName?: string;
  readonly listName = "Language Style";
  readonly listVersionId?: string;
  readonly listUri?: string;
  readonly listSchemeUri?: string;

  constructor(value: LanguageStyleCodelist, name?: string, languageId?: string) {
    this.value = value;
    this.name = name;
    this.languageId = languageId;
  }
}
