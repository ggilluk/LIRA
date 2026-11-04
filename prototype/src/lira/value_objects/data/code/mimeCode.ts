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
 * │ Module Name     │ lira/value_objects/data/code/mimeCode
 * │ Filename        │ mimeCode.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ MimeCode: the UN/CEFACT D25A MIME_ Code. Type (UN02000117),
 * │                 │ agency 379 (IANA). Accepts any well-formed media type and says
 * │                 │ whether IANA registers it.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/mimeCode
 * @file mimeCode.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Code } from "../code";
import { Uri } from "../uri";
import { MIME_CODELIST_VERSION, type MimeCodelist, mimeCodelistFromCode } from "../enum/mimeCodelist";

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
 *   Open, as D25A leaves it: any well-formed RFC 6838 media type is
 *   accepted, registered or not (`audio/wav`, `application/x-...`), since
 *   a filesystem stores whatever it's given. `MimeCodelist`'s members are
 *   the registered values to pick from, not a closed set; `isRegistered`
 *   says whether this one is among them.
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
  readonly value: string;
  readonly listAgencyId = "379";
  readonly listVersionId = MIME_CODELIST_VERSION;
  readonly listName = "Media Types";
  readonly listUri = new Uri("https://www.iana.org/assignments/media-types/media-types.xhtml");

  /** Throws for anything that isn't a well-formed `type/subtype`
   * media type (RFC 6838 section 4.2's own restricted-name grammar). */
  constructor(value: MimeCodelist | string) {
    if (!MIME_TYPE_PATTERN.test(value)) throw new Error(`not a valid media type: '${value}'`);
    this.value = value;
  }

  /** Whether IANA's Media Types registry (`MimeCodelist`) lists this
   * value, case-insensitively. */
  get isRegistered(): boolean {
    return mimeCodelistFromCode(this.value) !== undefined;
  }
}

const RESTRICTED_NAME = "[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}";
const MIME_TYPE_PATTERN = new RegExp(`^${RESTRICTED_NAME}/${RESTRICTED_NAME}$`);
