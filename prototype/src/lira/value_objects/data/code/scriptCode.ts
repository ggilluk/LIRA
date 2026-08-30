import type { Code } from "../code";
import { ScriptCodelist, scriptCodelistCode } from "../enum/scriptCodelist";

/** UN/CEFACT CCTS Code. Type specialised for ISO 15924 script codes. */
export class ScriptCode implements Code {
  readonly value: string;
  readonly codelist: ScriptCodelist;

  readonly name?: string;
  readonly languageId?: string;
  readonly listId = "ISO 15924";
  readonly listAgencyId = "5";
  readonly listAgencyName = "International Organization for Standardization";
  readonly listName = "Codes for the representation of names of scripts";
  readonly listVersionId?: string;
  readonly listUri?: string;
  readonly listSchemeUri = "https://unicode.org/iso15924/iso15924.txt";

  constructor(codelist: ScriptCodelist, name?: string, languageId?: string) {
    this.codelist = codelist;
    this.value = scriptCodelistCode(codelist);
    this.name = name;
    this.languageId = languageId;
  }
}
