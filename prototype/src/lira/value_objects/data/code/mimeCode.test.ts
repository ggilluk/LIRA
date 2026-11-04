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
 * │ Module Name     │ lira/value_objects/data/code/mimeCode.test
 * │ Filename        │ mimeCode.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for MimeCode's D25A attributes and
 * │                 │ mimeCodelistFromCode() lookups.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/mimeCode.test
 * @file mimeCode.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { describe, expect, it } from "vitest";
import { MimeCode } from "./mimeCode";
import { MIME_CODELIST_VERSION, MimeCodelist, mimeCodelistFromCode } from "../enum/mimeCodelist";

describe("MimeCode", () => {
  it("carries the type/subtype string as its own CCTS Code. Content", () => {
    expect(new MimeCode(MimeCodelist.TEXT_PLAIN).value).toBe("text/plain");
  });

  it("carries D25A's own four MIMECodeType supplementary components, IANA (UNCL 3055 code 379) as the agency", () => {
    const code = new MimeCode(MimeCodelist.IMAGE_PNG);
    expect(code.listAgencyId).toBe("379");
    expect(code.listVersionId).toBe(MIME_CODELIST_VERSION);
    expect(code.listName).toBe("Media Types");
    expect(code.listUri.value).toBe("https://www.iana.org/assignments/media-types/media-types.xhtml");
  });

  it("carries none of the Code fields D25A's MIMECodeType drops", () => {
    expect(Object.keys(new MimeCode(MimeCodelist.IMAGE_PNG)).sort()).toEqual(["listAgencyId", "listName", "listUri", "listVersionId", "value"]);
  });
});

describe("mimeCodelistFromCode", () => {
  it("resolves a member case-insensitively", () => {
    expect(mimeCodelistFromCode("Application/JSON")).toBe(MimeCodelist.APPLICATION_JSON);
  });

  it("matches a registered mixed-case value case-insensitively, returning IANA's own spelling", () => {
    expect(mimeCodelistFromCode("application/edi-x12")).toBe("application/EDI-X12");
  });

  it("returns undefined for a media type IANA hasn't registered", () => {
    expect(mimeCodelistFromCode("application/vnd.example")).toBeUndefined();
    expect(mimeCodelistFromCode("audio/wav")).toBeUndefined();
  });
});
