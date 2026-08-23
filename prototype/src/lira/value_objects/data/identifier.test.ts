import { describe, expect, it } from "vitest";
import { fnv1aHash, identifier } from "./identifier";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("identifier", () => {
  it("auto-assigns a fresh v4 uuid and a content hash of value when no extra attributes are given", () => {
    const id = identifier("dogs");
    expect(id.value).toBe("dogs");
    expect(id.uuid).toMatch(UUID_V4);
    expect(id.hash).toBe(fnv1aHash("dogs"));
  });

  it("assigns a different uuid to each call, even for the same value", () => {
    expect(identifier("dogs").uuid).not.toBe(identifier("dogs").uuid);
  });

  it("hashes deterministically -- same value, same hash, every time", () => {
    expect(identifier("dogs").hash).toBe(identifier("dogs").hash);
    expect(identifier("dogs").hash).not.toBe(identifier("cats").hash);
  });

  it("carries scheme attributes alongside the auto-assigned uuid/hash when extra is given", () => {
    const id = identifier("00061234-n", { schemeId: "wordnet-synset-id" });
    expect(id).toMatchObject({ value: "00061234-n", schemeId: "wordnet-synset-id" });
    expect(id.uuid).toMatch(UUID_V4);
    expect(id.hash).toBe(fnv1aHash("00061234-n"));
  });

  it("lets the caller's own extra override the auto-assigned uuid/hash", () => {
    expect(identifier("dogs", { uuid: "fixed-uuid", hash: "fixed-hash" })).toEqual({
      value: "dogs",
      uuid: "fixed-uuid",
      hash: "fixed-hash",
    });
  });
});

describe("fnv1aHash", () => {
  it("returns an 8-character hex string", () => {
    expect(fnv1aHash("dogs")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is stable for the empty string (FNV-1a's own offset basis, unaffected by an empty loop)", () => {
    expect(fnv1aHash("")).toBe("811c9dc5");
  });
});
