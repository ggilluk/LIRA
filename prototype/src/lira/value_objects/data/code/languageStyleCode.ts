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
 * │ Module Name     │ lira/value_objects/data/code/languageStyleCode
 * │ Filename        │ languageStyleCode.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-31
 * │ Modified Date   │ 2026-10-06
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ LanguageStyleCode: CCTS Code specialised for a text's register
 * │                 │ or style of language use.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/languageStyleCode
 * @file languageStyleCode.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Code } from "../code";
import type { Uri } from "../uri";
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
  readonly listUri?: Uri;
  readonly listSchemeUri?: Uri;

  constructor(value: LanguageStyleCodelist, name?: string, languageId?: string) {
    this.value = value;
    this.name = name;
    this.languageId = languageId;
  }
}
