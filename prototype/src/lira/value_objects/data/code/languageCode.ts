import type { Code } from "../code";
import { LanguageCodelist, languageCodelistCode } from "../enum/languageCodelist";

/** UN/CEFACT CCTS Code. Type specialised for ISO 639-1 language codes. */
export class LanguageCode implements Code {
  readonly value: string;
  readonly codelist: LanguageCodelist;

  readonly name?: string;
  readonly languageId?: string;
  readonly listId = "ISO 639-1";
  readonly listAgencyId = "5";
  readonly listAgencyName = "International Organization for Standardization";
  readonly listName = "Codes for the representation of names of languages — Part 1: Alpha-2 code";
  readonly listVersionId?: string;
  readonly listUri?: string;
  readonly listSchemeUri = "https://www.iso.org/iso-639-language-code";

  constructor(codelist: LanguageCodelist, name?: string, languageId?: string) {
    this.codelist = codelist;
    this.value = languageCodelistCode(codelist);
    this.name = name;
    this.languageId = languageId;
  }
}
