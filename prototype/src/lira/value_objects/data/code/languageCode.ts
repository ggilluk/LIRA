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
 * │ Module Name     │ lira/value_objects/data/code/languageCode
 * │ Filename        │ languageCode.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-30
 * │ Modified Date   │ 2026-10-06
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ LanguageCode: CCTS Code specialised for ISO 639-1 language
 * │                 │ codes.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/languageCode
 * @file languageCode.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Code } from "../code";
import { Uri } from "../uri";
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
  readonly listUri?: Uri;
  readonly listSchemeUri = new Uri("https://www.iso.org/iso-639-language-code");

  constructor(codelist: LanguageCodelist, name?: string, languageId?: string) {
    this.codelist = codelist;
    this.value = languageCodelistCode(codelist);
    this.name = name;
    this.languageId = languageId;
  }
}
