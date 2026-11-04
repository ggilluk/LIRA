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
 * │ Module Name     │ lira/value_objects/data/binary_object.test
 * │ Filename        │ binary_object.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-02
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for the BinaryObject value object.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/binary_object.test
 * @file binary_object.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { describe, expect, it } from "vitest";
import { binaryObject } from "./binary_object";
import { Uri } from "./uri";
import { MimeCode } from "./code/mimeCode";
import { MimeCodelist } from "./enum/mimeCodelist";
import { CharacterSetCode } from "./code/characterSetCode";
import { CharacterSetCodelist } from "./enum/characterSetCodelist";
import { EncodingCode } from "./code/encodingCode";
import { EncodingCodelist } from "./enum/encodingCodelist";

const utf8 = new CharacterSetCode(CharacterSetCodelist.UTF_8);
const utf8Encoding = new EncodingCode(EncodingCodelist.UTF_8);

describe("binaryObject", () => {
  it("carries only value when no supplementary components are given", () => {
    const value = new Uint8Array([1, 2, 3]);
    expect(binaryObject(value)).toEqual({ value });
  });

  it("carries mimeCode and characterSetCode alone when only those are given", () => {
    const value = new Uint8Array([104, 105]);
    const mimeCode = new MimeCode(MimeCodelist.TEXT_PLAIN);
    expect(binaryObject(value, { mimeCode, characterSetCode: utf8 })).toEqual({
      value,
      mimeCode,
      characterSetCode: utf8,
    });
  });

  it("carries every supplementary component together when all are given", () => {
    const value = new Uint8Array([0xff, 0x00]);
    const uri = new Uri("https://example.org/a.bin");
    const mimeCode = new MimeCode(MimeCodelist.APPLICATION_OCTET_STREAM);
    expect(
      binaryObject(value, { format: "raw", mimeCode, encodingCode: utf8Encoding, characterSetCode: utf8, uri, filename: "a.bin" }),
    ).toEqual({ value, format: "raw", mimeCode, encodingCode: utf8Encoding, characterSetCode: utf8, uri, filename: "a.bin" });
  });

  it("keeps value as the exact same bytes it was given, never re-encoded", () => {
    const value = new Uint8Array([0x00, 0x80, 0xff]);
    expect(Array.from(binaryObject(value).value)).toEqual([0x00, 0x80, 0xff]);
  });
});
