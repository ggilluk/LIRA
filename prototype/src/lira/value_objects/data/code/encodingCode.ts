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
 * │ Module Name     │ lira/value_objects/data/code/encodingCode
 * │ Filename        │ encodingCode.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ EncodingCode: the UN/CEFACT D25A Binary Object Encoding_ Code.
 * │                 │ Type (UN02000178) over code list 0133, agency 6 (UN/ECE).
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/encodingCode
 * @file encodingCode.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Code } from "../code";
import { ENCODING_CODELIST_VERSION, ENCODING_DECODER_LABELS, ENCODING_NAMES, type EncodingCodelist } from "../enum/encodingCodelist";

/**
 * UN/CEFACT `Binary Object Encoding_ Code. Type` (QDT, UniqueID
 * UN02000178, version 1.0,
 * value_objects/assets/uncefact/data/standard/QualifiedDataType_37p0.xsd,
 * release D25A) -- the qualified CCTS Code. Type for the encoding a
 * binary object's bytes must be decoded with, the value Binary Object.
 * Encoding. Code (value_objects/data/binary_object.ts) carries.
 *
 * Carries exactly D25A's own content and supplementary components --
 * every one of them fixed by D25A -- the same discipline MimeCode and
 * CharacterSetCode (this same folder) follow:
 * - `value`: Code. Content -- a UN/CEFACT code list 0133 code
 *   (`EncodingCodelist`).
 * - `listId`: Code List. Identifier -- "0133".
 * - `listAgencyId`: Code List. Agency. Identifier -- "6", UN/ECE in
 *   UNCL 3055: this is UN/CEFACT's own code list, not IANA's.
 * - `listVersionId`: Code List. Version. Identifier -- "40106".
 * - `listName`: Code List. Name. Text -- "Character Set Encoding Code".
 */
export class EncodingCode implements Code {
  readonly value: EncodingCodelist;
  readonly listId = "0133";
  readonly listAgencyId = "6";
  readonly listVersionId = ENCODING_CODELIST_VERSION;
  readonly listName = "Character Set Encoding Code";

  constructor(value: EncodingCodelist) {
    this.value = value;
  }

  /** This code's own D25A name ("UTF-8", "ASCII 7 bit", ...). */
  get name(): string {
    return ENCODING_NAMES[this.value];
  }

  /** The `TextDecoder` label for this encoding, or undefined when no
   * browser decoder exists for it (`ENCODING_DECODER_LABELS`). */
  get decoderLabel(): string | undefined {
    return ENCODING_DECODER_LABELS[this.value];
  }
}
