import type { Code } from "../code";
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
  readonly listUri?: string;
  readonly listSchemeUri = "https://www.internationalphoneticassociation.org/content/ipa-chart";

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
