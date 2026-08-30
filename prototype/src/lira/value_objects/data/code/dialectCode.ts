import type { Code } from "../code";
import { DialectCodelist, dialectCodelistCode } from "../enum/dialectCodelist";

/**
 * CCTS Code. Type specialised for a language variety/dialect.
 *
 * UN/CEFACT does not publish a standalone dialect code list. CCTS language/
 * locale handling points to RFC language-tag practice, so LIRA uses IANA
 * Language Subtag Registry `variant` subtags as the source list.
 */
export class DialectCode implements Code {
  readonly value: string;
  readonly codelist: DialectCodelist;

  readonly name?: string;
  readonly languageId?: string;
  readonly listId?: string;
  readonly listAgencyId?: string;
  readonly listAgencyName = "Internet Assigned Numbers Authority";
  readonly listName = "Language Subtag Registry - variant subtags";
  readonly listVersionId?: string;
  readonly listUri?: string;
  readonly listSchemeUri = "https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry";

  constructor(codelist: DialectCodelist, name?: string, languageId?: string) {
    this.codelist = codelist;
    this.value = dialectCodelistCode(codelist);
    this.name = name;
    this.languageId = languageId;
  }
}
