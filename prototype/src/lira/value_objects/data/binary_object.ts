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
 * │ Module Name     │ lira/value_objects/data/binary_object
 * │ Filename        │ binary_object.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-02
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ BinaryObject: the CCTS Binary Object. Type (UN/CEFACT D25A
 * │                 │ UDT000002) - bytes plus format, MIME, encoding, character set,
 * │                 │ URI and filename.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/binary_object
 * @file binary_object.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { MimeCode } from "./code/mimeCode";
import type { Uri } from "./uri";

/** Binary Object. Type, per the UN/CEFACT Core Components Technical
 * Specification (CCTS) Core Component Type catalogue (Layer Summary:
 * Value Objects Layer) -- `value` is Binary Object. Content, and every
 * other field is one of its six supplementary components (Format. Text,
 * Mime. Code, Encoding. Code, Character Set. Code, Uniform Resource.
 * Identifier, Filename. Text), matching UN/CEFACT D25A's own
 * `BinaryObjectType` (UDT, UniqueID UDT000002, CCTS version 2.01,
 * value_objects/assets/uncefact/data/standard/UnqualifiedDataType_37p0.xsd).
 * Ported from
 * value_objects/data/binary_object.py, except `value`: `bytes` there,
 * `Uint8Array` here -- the browser's own byte-sequence type, readable
 * synchronously (a `Blob` is only readable asynchronously, which would
 * turn every reader of this value object async for no reason of its
 * own) -- `uri`: `string` there, `Uri` here -- Code.listUri's own
 * exact reasoning (data/code.ts) -- and `mimeCode`: `string` there,
 * `MimeCode` here (data/code/mimeCode.ts) -- an `xsd:token` in D25A's
 * own UDT, but CCTS names it a Code and D25A's own `MIME_ Code. Type`
 * (QDT) is exactly that Code qualified for MIME types, the same way
 * Text's own `languageCode`/`scriptCode` are Codes, not strings.
 *
 * `filename` is `readonly`: a holder may supply it as a getter bound to
 * wherever the name really lives rather than as a copied string
 * (common/data/virtual_file_system.ts's own files do exactly this, so a
 * `mv` can never leave a file's own `filename` stale) -- `readonly`
 * here is what lets a getter-only property satisfy this interface. */
export interface BinaryObject {
  value: Uint8Array;
  format?: string;
  mimeCode?: MimeCode;
  encodingCode?: string;
  characterSetCode?: string;
  uri?: Uri;
  readonly filename?: string;
}

export function binaryObject(value: Uint8Array, extra: Omit<BinaryObject, "value"> = {}): BinaryObject {
  return { value, ...extra };
}
