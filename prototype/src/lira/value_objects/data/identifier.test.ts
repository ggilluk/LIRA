import { describe, expect, it } from "vitest";
import { fnv1aHash, identifier, randomGraphUuid } from "./identifier";

// Number.MAX_SAFE_INTEGER is 2^53 - 1 -- randomGraphUuid()'s own full
// safe-integer range (that function's own docstring on why).
const MAX_SAFE_GRAPH_UUID = 2 ** 53;

describe("identifier", () => {
  it("auto-assigns a fresh random graph-identity number and a content hash of value when no extra attributes are given", () => {
    const id = identifier("dogs");
    expect(id.value).toBe("dogs");
    expect(Number.isInteger(id.uuid)).toBe(true);
    expect(id.uuid).toBeGreaterThanOrEqual(0);
    expect(id.uuid).toBeLessThan(MAX_SAFE_GRAPH_UUID);
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
    expect(Number.isInteger(id.uuid)).toBe(true);
    expect(id.hash).toBe(fnv1aHash("00061234-n"));
  });

  it("lets the caller's own extra override the auto-assigned uuid/hash", () => {
    expect(identifier("dogs", { uuid: 42, hash: "fixed-hash" })).toEqual({
      value: "dogs",
      uuid: 42,
      hash: "fixed-hash",
    });
  });
});

describe("randomGraphUuid", () => {
  it("returns a safe integer in [0, 2^53), a different value each call", () => {
    const a = randomGraphUuid();
    const b = randomGraphUuid();
    expect(Number.isSafeInteger(a)).toBe(true);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(MAX_SAFE_GRAPH_UUID);
    expect(a).not.toBe(b);
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
