import type { Code } from "../code";
import { PronounciationCategoryCodelist } from "../enum/pronounciationCategoryCodelist";

/**
 * UN/CEFACT CCTS Code. Type specialised for a pronunciation category.
 *
 * CCTS Code. Content is represented by `value`. The category code list is a
 * LIRA code list aligned to the major sections of the official IPA chart, so
 * no UNCL 3055 agency identifier is asserted.
 */
export class PronounciationCategoryCode implements Code {
  readonly value: PronounciationCategoryCodelist;

  readonly name?: string;
  readonly languageId?: string;
  readonly listId?: string;
  readonly listAgencyId?: string;
  readonly listAgencyName?: string;
  readonly listName = "Pronounciation Category";
  readonly listVersionId?: string;
  readonly listUri?: string;
  readonly listSchemeUri?: string;

  constructor(
    value: PronounciationCategoryCodelist,
    name?: string,
    languageId?: string,
    listVersionId?: string,
    listUri?: string,
    listSchemeUri?: string,
  ) {
    this.value = value;
    this.name = name;
    this.languageId = languageId;
    this.listVersionId = listVersionId;
    this.listUri = listUri;
    this.listSchemeUri = listSchemeUri;
  }
}
