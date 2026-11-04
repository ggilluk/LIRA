import type { Code } from "../code";
import { Uri } from "../uri";
import { MIME_CODELIST_VERSION, MimeCodelist } from "../enum/mimeCodelist";

/**
 * UN/CEFACT `MIME_ Code. Type` (QDT, UniqueID UN02000117, version 2.0,
 * value_objects/assets/uncefact/data/standard/QualifiedDataType_37p0.xsd,
 * release D25A) -- the qualified CCTS Code. Type for a MIME (media)
 * type, the value Binary Object. Mime. Code
 * (value_objects/data/binary_object.ts) carries.
 *
 * Carries exactly D25A's own content and four supplementary components,
 * not every optional field `Code` allows -- `MIMECodeType` qualifies
 * Code. Type down to these and drops the rest (`listID`,
 * `listAgencyName`, `listSchemeURI`, `name`, `languageID`):
 * - `value`: Code. Content, an `xsd:token` -- the `type/subtype` string.
 * - `listAgencyId`: Code List. Agency. Identifier -- "379", the one
 *   value D25A's own `MIMECodeListAgencyIDContentType` allows: IANA in
 *   UNCL 3055 (value_objects/assets/uncefact/codelist/standard/UNECE_AgencyIdentificationCode_D24A.xsd).
 * - `listVersionId`: Code List. Version. Identifier -- the IANA
 *   registry's own last-updated date `MimeCodelist` was generated from
 *   (`MIME_CODELIST_VERSION`, data/enum/mimeCodelist.ts).
 * - `listName`: Code List. Name. Text -- "Media Types", the registry's
 *   own `<title>`.
 * - `listUri`: Code List. Uniform Resource. Identifier -- where the code
 *   list is located: the registry itself.
 * All four are facts about the code list, not about this one code, so
 * every `MimeCode` carries the same values -- the same fixed-per-class
 * treatment every other `code/*.ts` Code gives its own list fields.
 */
export class MimeCode implements Code {
  readonly value: MimeCodelist;
  readonly listAgencyId = "379";
  readonly listVersionId = MIME_CODELIST_VERSION;
  readonly listName = "Media Types";
  readonly listUri = new Uri("https://www.iana.org/assignments/media-types/media-types.xhtml");

  constructor(value: MimeCodelist) {
    this.value = value;
  }
}
