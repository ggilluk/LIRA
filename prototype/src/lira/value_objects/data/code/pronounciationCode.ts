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
 * │ Module Name     │ lira/value_objects/data/code/pronounciationCode
 * │ Filename        │ pronounciationCode.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-30
 * │ Modified Date   │ 2026-10-06
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ PronounciationCode: CCTS Code specialised for IPA pronunciation
 * │                 │ symbols.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/pronounciationCode
 * @file pronounciationCode.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Code } from "../code";
import { Uri } from "../uri";
import { PronounciationCodelist } from "../enum/pronounciationCodelist";
import { PronounciationCategoryCodelist } from "../enum/pronounciationCategoryCodelist";

/**
 * UN/CEFACT CCTS Code. Type specialised for an IPA pronunciation symbol.
 *
 * CCTS Code. Content is represented by `value`. The code-list supplementary
 * components use the names defined by the shared Code value object. The
 * International Phonetic Association has no verified UNCL 3055 agency code,
 * so listAgencyId is intentionally omitted and listAgencyName is used.
 *
 * `category`, `ipaNumber`, `unicodeCodePoints`, and `unicodeNames` are
 * pronunciation-specific supplementary LIRA properties, not CCTS components.
 */
export class PronounciationCode implements Code {
  readonly value: PronounciationCodelist;

  readonly name?: string;
  readonly languageId?: string;
  readonly listId?: string;
  readonly listAgencyId?: string;
  readonly listAgencyName = "International Phonetic Association";
  readonly listName = "International Phonetic Alphabet";
  readonly listVersionId?: string;
  readonly listUri?: Uri;
  readonly listSchemeUri = new Uri("https://www.internationalphoneticassociation.org/content/ipa-chart");

  readonly category: PronounciationCategoryCodelist;
  readonly ipaNumber?: string;
  readonly unicodeCodePoints: string[];
  readonly unicodeNames: string[];

  constructor(
    value: PronounciationCodelist,
    category: PronounciationCategoryCodelist,
    unicodeCodePoints: string[] = [],
    unicodeNames: string[] = [],
    ipaNumber?: string,
    name?: string,
    languageId?: string,
    listVersionId?: string,
  ) {
    this.value = value;
    this.category = category;
    this.unicodeCodePoints = unicodeCodePoints;
    this.unicodeNames = unicodeNames;
    this.ipaNumber = ipaNumber;
    this.name = name;
    this.languageId = languageId;
    this.listVersionId = listVersionId;
  }
}
