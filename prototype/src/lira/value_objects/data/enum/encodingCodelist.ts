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
 * │ Module Name     │ lira/value_objects/data/enum/encodingCodelist
 * │ Filename        │ encodingCodelist.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ EncodingCodelist: UN/CEFACT code list 0133 (Character Set
 * │                 │ Encoding Code, version 40106) as D25A publishes it, with names
 * │                 │ and browser decoder labels.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/enum/encodingCodelist
 * @file encodingCodelist.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** UN/CEFACT code list 0133, Character Set Encoding Code, version 40106,
 * exactly as UN/CEFACT D25A publishes it
 * (value_objects/assets/uncefact/codelist/standard/UNECE_CharacterSetEncodingCode_40106.xsd,
 * all 9 entries) -- the code list D25A's own `Binary Object Encoding_
 * Code. Type` restricts its content to. String values are the source
 * codes themselves ("ZZZ" is not numeric); enum names annotate each
 * code's own D25A name. */
export enum EncodingCodelist {
  ASCII_7_BIT = "1",
  ASCII_8_BIT = "2",
  CODE_PAGE_500_EBCDIC_MULTINATIONAL_NO_5 = "3",
  CODE_PAGE_850_IBM_PC_MULTINATIONAL = "4",
  UCS_2 = "5",
  UCS_4 = "6",
  UTF_8 = "7",
  UTF_16 = "8",
  MUTUALLY_AGREED = "ZZZ",
}

/** The D25A code list's own version -- `EncodingCode.listVersionId`,
 * which D25A's own `Binary Object Encoding_ Code. Type` fixes. */
export const ENCODING_CODELIST_VERSION = "40106";

/** Each member's own D25A name. */
export const ENCODING_NAMES: Readonly<Record<EncodingCodelist, string>> = {
  [EncodingCodelist.ASCII_7_BIT]: "ASCII 7 bit",
  [EncodingCodelist.ASCII_8_BIT]: "ASCII 8 bit",
  [EncodingCodelist.CODE_PAGE_500_EBCDIC_MULTINATIONAL_NO_5]: "Code page 500 (EBCDIC Multinational No. 5)",
  [EncodingCodelist.CODE_PAGE_850_IBM_PC_MULTINATIONAL]: "Code page 850 (IBM PC Multinational)",
  [EncodingCodelist.UCS_2]: "UCS-2",
  [EncodingCodelist.UCS_4]: "UCS-4",
  [EncodingCodelist.UTF_8]: "UTF-8",
  [EncodingCodelist.UTF_16]: "UTF-16",
  [EncodingCodelist.MUTUALLY_AGREED]: "Mutually agreed",
};

/** The WHATWG Encoding Standard label (what `TextDecoder` takes) for the
 * members a browser can decode -- code pages 500/850 and UCS-4 have no
 * WHATWG decoder, and "mutually agreed" names no particular encoding,
 * so those have none. UCS-2 is decoded as UTF-16LE, its byte-compatible
 * superset; UTF-16 without a byte-order mark is little-endian in WHATWG
 * decoding too. */
export const ENCODING_DECODER_LABELS: Readonly<Partial<Record<EncodingCodelist, string>>> = {
  [EncodingCodelist.ASCII_7_BIT]: "us-ascii",
  [EncodingCodelist.ASCII_8_BIT]: "windows-1252",
  [EncodingCodelist.UCS_2]: "utf-16le",
  [EncodingCodelist.UTF_8]: "utf-8",
  [EncodingCodelist.UTF_16]: "utf-16",
};

/** The `EncodingCodelist` member whose code is `code` (exact, as D25A's
 * own codes are), or `undefined` when `code` names no member. */
export function encodingCodelistFromCode(code: string): EncodingCodelist | undefined {
  return Object.values(EncodingCodelist).find((value) => value === code);
}
