import { describe, expect, it } from "vitest";
import { Uri } from "./uri";

describe("Uri", () => {
  it("constructs from a well-formed absolute URI, keeping value exactly as given", () => {
    const uri = new Uri("https://www.iso.org/iso-639-language-code");
    expect(uri.value).toBe("https://www.iso.org/iso-639-language-code");
  });

  it("accepts a non-http scheme too -- any scheme URL itself parses, not just http(s)", () => {
    expect(new Uri("urn:isbn:0451450523").value).toBe("urn:isbn:0451450523");
  });

  it("throws for a relative reference -- no base to resolve one against", () => {
    expect(() => new Uri("/iso-639-language-code")).toThrow(/not a valid absolute URI/);
  });

  it("throws for a bare scheme-less string", () => {
    expect(() => new Uri("not a uri")).toThrow(/not a valid absolute URI/);
  });

  it("throws for an empty string", () => {
    expect(() => new Uri("")).toThrow(/not a valid absolute URI/);
  });

  it("never silently normalises value -- an unnormalised-but-valid URI round-trips through the constructor unchanged", () => {
    const uri = new Uri("HTTP://Example.com");
    expect(uri.value).toBe("HTTP://Example.com");
  });
});

describe("Uri.isValid", () => {
  it("returns true for a well-formed absolute URI, without constructing", () => {
    expect(Uri.isValid("https://www.iso.org/iso-639-language-code")).toBe(true);
  });

  it("returns false for a relative reference or a scheme-less string, without throwing", () => {
    expect(Uri.isValid("/iso-639-language-code")).toBe(false);
    expect(Uri.isValid("not a uri")).toBe(false);
    expect(Uri.isValid("")).toBe(false);
  });
});

describe("Uri.fromUrl / toUrl round-trip", () => {
  it("fromUrl builds a Uri from a real URL's own href", () => {
    const url = new URL("https://www.iso.org/iso-639-language-code");
    expect(Uri.fromUrl(url).value).toBe(url.href);
  });

  it("toUrl parses value back into a real URL, exposing its own structured parts", () => {
    const uri = new Uri("https://example.com/path?query=1#fragment");
    const url = uri.toUrl();
    expect(url).toBeInstanceOf(URL);
    expect(url.origin).toBe("https://example.com");
    expect(url.pathname).toBe("/path");
    expect(url.search).toBe("?query=1");
    expect(url.hash).toBe("#fragment");
  });

  it("Uri -> URL -> Uri is stable once already in URL's own normalised form", () => {
    const original = new Uri("https://example.com/path?query=1");
    const roundTripped = Uri.fromUrl(original.toUrl());
    expect(roundTripped.value).toBe(original.value);
  });

  it("Uri -> URL -> Uri normalises an unnormalised input -- this is where normalisation actually happens, not in the constructor", () => {
    const original = new Uri("HTTP://Example.com");
    const roundTripped = Uri.fromUrl(original.toUrl());
    expect(roundTripped.value).toBe("http://example.com/");
    expect(roundTripped.value).not.toBe(original.value);
  });
});
