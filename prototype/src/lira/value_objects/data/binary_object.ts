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
 * │ Description     │ BinaryObject: the immutable CCTS Binary Object. Type (UN/CEFACT
 * │                 │ D25A UDT000002) - bytes plus format, MIME code, encoding,
 * │                 │ character set code, URI and filename.
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
import type { CharacterSetCode } from "./code/characterSetCode";
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
 * Text's own `languageCode`/`scriptCode` are Codes, not strings -- and
 * `characterSetCode`: `string` there, `CharacterSetCode` here
 * (data/code/characterSetCode.ts), D25A's own `Binary Object Character
 * Set_ Code. Type` (QDT) over its IANA character set code list.
 *
 * A value, not an entity: every field is `readonly`, and a holder that
 * needs different content builds a new BinaryObject rather than
 * changing this one. `readonly` can't stop writes into `value`'s own
 * bytes (TypeScript has no read-only typed array), so a holder that
 * must guarantee its content never changes underneath it -- the
 * VirtualFileSystem (common/data/virtual_file_system.ts) -- copies the
 * bytes on the way in and on the way out. */
export interface BinaryObject {
  readonly value: Uint8Array;
  readonly format?: string;
  readonly mimeCode?: MimeCode;
  readonly encodingCode?: string;
  readonly characterSetCode?: CharacterSetCode;
  readonly uri?: Uri;
  readonly filename?: string;
}

export function binaryObject(value: Uint8Array, extra: Omit<BinaryObject, "value"> = {}): BinaryObject {
  return { value, ...extra };
}
