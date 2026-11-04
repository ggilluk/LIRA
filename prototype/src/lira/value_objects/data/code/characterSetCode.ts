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
 * │ Module Name     │ lira/value_objects/data/code/characterSetCode
 * │ Filename        │ characterSetCode.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ CharacterSetCode: the UN/CEFACT D25A Binary Object Character Set_
 * │                 │ Code. Type (UN02000179) over the IANA character set list.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/characterSetCode
 * @file characterSetCode.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Code } from "../code";
import { CHARACTER_SET_CODELIST_VERSION, CHARACTER_SET_LABELS, type CharacterSetCodelist } from "../enum/characterSetCodelist";

/**
 * UN/CEFACT `Binary Object Character Set_ Code. Type` (QDT, UniqueID
 * UN02000179, version 1.0,
 * value_objects/assets/uncefact/data/standard/QualifiedDataType_37p0.xsd,
 * release D25A) -- the qualified CCTS Code. Type for the character set
 * of a binary object whose MIME type is text, the value Binary Object.
 * Character Set. Code (value_objects/data/binary_object.ts) carries.
 *
 * Carries exactly D25A's own content and supplementary components, the
 * same discipline MimeCode (this same folder) follows:
 * - `value`: Code. Content -- the IANA MIBenum code as a string ("106"
 *   for UTF-8), restricted to D25A's own IANA_CharacterSetCode list.
 * - `listAgencyId`: Code List. Agency. Identifier -- "379", IANA in
 *   UNCL 3055; D25A leaves this one open, so it carries the same agency
 *   MimeCode's own D25A type fixes.
 * - `listVersionId`: Code List. Version. Identifier -- "2013-01-23",
 *   fixed by D25A.
 * - `listName`: Code List. Name. Text -- "Character Set Code", fixed by
 *   D25A.
 * `codelist` is the one addition: the enum member `value` was built
 * from, the same pairing ScriptCode/DialectCode keep for their own
 * numeric code lists.
 */
export class CharacterSetCode implements Code {
  readonly value: string;
  readonly codelist: CharacterSetCodelist;
  readonly listAgencyId = "379";
  readonly listVersionId = CHARACTER_SET_CODELIST_VERSION;
  readonly listName = "Character Set Code";

  constructor(codelist: CharacterSetCodelist) {
    this.codelist = codelist;
    this.value = String(codelist);
  }

  /** This character set's IANA name followed by its aliases -- the
   * labels to try, in order, when handing it to a decoder. */
  labels(): readonly string[] {
    return CHARACTER_SET_LABELS[this.codelist];
  }
}
