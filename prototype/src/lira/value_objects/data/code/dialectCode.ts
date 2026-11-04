/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/value_objects/data/code/dialectCode
 * │ Filename        │ dialectCode.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-30
 * │ Modified Date   │ 2026-10-06
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ DialectCode: CCTS Code specialised for language varieties, from
 * │                 │ IANA Language Subtag Registry variant subtags.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/dialectCode
 * @file dialectCode.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Code } from "../code";
import { Uri } from "../uri";
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
  readonly listUri?: Uri;
  readonly listSchemeUri = new Uri("https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry");

  constructor(codelist: DialectCodelist, name?: string, languageId?: string) {
    this.codelist = codelist;
    this.value = dialectCodelistCode(codelist);
    this.name = name;
    this.languageId = languageId;
  }
}
