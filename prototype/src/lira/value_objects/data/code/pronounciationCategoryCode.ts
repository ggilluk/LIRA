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
 * │ Module Name     │ lira/value_objects/data/code/pronounciationCategoryCode
 * │ Filename        │ pronounciationCategoryCode.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-30
 * │ Modified Date   │ 2026-10-06
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ PronounciationCategoryCode: CCTS Code specialised for IPA
 * │                 │ chart pronunciation categories.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/pronounciationCategoryCode
 * @file pronounciationCategoryCode.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Code } from "../code";
import type { Uri } from "../uri";
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
  readonly listUri?: Uri;
  readonly listSchemeUri?: Uri;

  constructor(
    value: PronounciationCategoryCodelist,
    name?: string,
    languageId?: string,
    listVersionId?: string,
    listUri?: Uri,
    listSchemeUri?: Uri,
  ) {
    this.value = value;
    this.name = name;
    this.languageId = languageId;
    this.listVersionId = listVersionId;
    this.listUri = listUri;
    this.listSchemeUri = listSchemeUri;
  }
}
