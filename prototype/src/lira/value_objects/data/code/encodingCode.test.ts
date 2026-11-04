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
 * │ Module Name     │ lira/value_objects/data/code/encodingCode.test
 * │ Filename        │ encodingCode.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for EncodingCode's D25A attributes, names and
 * │                 │ decoder labels.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/encodingCode.test
 * @file encodingCode.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { describe, expect, it } from "vitest";
import { EncodingCode } from "./encodingCode";
import { ENCODING_CODELIST_VERSION, EncodingCodelist, encodingCodelistFromCode } from "../enum/encodingCodelist";

describe("EncodingCode", () => {
  it("carries the UN/CEFACT code list 0133 code as its own CCTS Code. Content", () => {
    expect(new EncodingCode(EncodingCodelist.UTF_8).value).toBe("7");
    expect(new EncodingCode(EncodingCodelist.MUTUALLY_AGREED).value).toBe("ZZZ");
  });

  it("carries D25A's own fixed Binary Object Encoding_ Code. Type supplementary components", () => {
    const code = new EncodingCode(EncodingCodelist.UTF_16);
    expect(code.listId).toBe("0133");
    expect(code.listAgencyId).toBe("6");
    expect(code.listVersionId).toBe("40106");
    expect(ENCODING_CODELIST_VERSION).toBe("40106");
    expect(code.listName).toBe("Character Set Encoding Code");
  });

  it("names each code as D25A does, with a decoder label only where a browser can decode it", () => {
    expect(new EncodingCode(EncodingCodelist.UTF_16).name).toBe("UTF-16");
    expect(new EncodingCode(EncodingCodelist.UTF_8).decoderLabel).toBe("utf-8");
    expect(new EncodingCode(EncodingCodelist.UCS_4).decoderLabel).toBeUndefined();
    expect(new EncodingCode(EncodingCodelist.MUTUALLY_AGREED).decoderLabel).toBeUndefined();
  });
});

describe("encodingCodelistFromCode", () => {
  it("resolves every one of D25A's 9 codes, and nothing else", () => {
    expect(Object.values(EncodingCodelist)).toHaveLength(9);
    expect(encodingCodelistFromCode("8")).toBe(EncodingCodelist.UTF_16);
    expect(encodingCodelistFromCode("9")).toBeUndefined();
  });
});
