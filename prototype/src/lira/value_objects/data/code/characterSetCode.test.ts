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
 * │ Module Name     │ lira/value_objects/data/code/characterSetCode.test
 * │ Filename        │ characterSetCode.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for CharacterSetCode's D25A attributes and the
 * │                 │ CharacterSetCodelist label lookup.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/characterSetCode.test
 * @file characterSetCode.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { describe, expect, it } from "vitest";
import { CharacterSetCode } from "./characterSetCode";
import { CHARACTER_SET_CODELIST_VERSION, CHARACTER_SET_LABELS, CharacterSetCodelist, characterSetCodelistFromLabel } from "../enum/characterSetCodelist";

describe("CharacterSetCode", () => {
  it("carries the IANA MIBenum code as its own CCTS Code. Content", () => {
    const code = new CharacterSetCode(CharacterSetCodelist.UTF_8);
    expect(code.value).toBe("106");
    expect(code.codelist).toBe(CharacterSetCodelist.UTF_8);
  });

  it("carries D25A's own Binary Object Character Set_ Code. Type supplementary components", () => {
    const code = new CharacterSetCode(CharacterSetCodelist.US_ASCII);
    expect(code.listAgencyId).toBe("379");
    expect(code.listVersionId).toBe("2013-01-23");
    expect(CHARACTER_SET_CODELIST_VERSION).toBe("2013-01-23");
    expect(code.listName).toBe("Character Set Code");
  });

  it("lists its IANA name first, then its aliases", () => {
    expect(new CharacterSetCode(CharacterSetCodelist.ISO_8859_1_1987).labels()).toEqual(["ISO_8859-1:1987", "iso-ir-100", "ISO_8859-1", "ISO-8859-1", "latin1", "l1", "IBM819", "CP819", "csISOLatin1"]);
  });
});

describe("CharacterSetCodelist", () => {
  it("holds every one of D25A's 257 IANA character sets", () => {
    expect(Object.keys(CHARACTER_SET_LABELS)).toHaveLength(257);
  });

  it("resolves a set from its name or any alias, case-insensitively", () => {
    expect(characterSetCodelistFromLabel("utf-8")).toBe(CharacterSetCodelist.UTF_8);
    expect(characterSetCodelistFromLabel("LATIN1")).toBe(CharacterSetCodelist.ISO_8859_1_1987);
    expect(characterSetCodelistFromLabel("not-a-charset")).toBeUndefined();
  });
});
