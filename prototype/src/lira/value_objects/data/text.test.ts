import { describe, expect, it } from "vitest";
import { text } from "./text";

describe("text", () => {
  it("carries only value when no extra attributes are given", () => {
    expect(text("dogs")).toEqual({ value: "dogs" });
  });

  it("carries languageCode alone when only that's given", () => {
    expect(text("dogs", { languageCode: { value: "en" } })).toEqual({ value: "dogs", languageCode: { value: "en" } });
  });

  it("carries formats alone when only that's given", () => {
    expect(text("dogs", { formats: ["/s$/i"] })).toEqual({ value: "dogs", formats: ["/s$/i"] });
  });

  it("carries languageCode, scriptCode, version, and formats together when all are given", () => {
    expect(
      text("dogs", { languageCode: { value: "en" }, scriptCode: { value: "Latn" }, version: "1.0", formats: ["/s$/i"] }),
    ).toEqual({ value: "dogs", languageCode: { value: "en" }, scriptCode: { value: "Latn" }, version: "1.0", formats: ["/s$/i"] });
  });

  it("carries dialectCode alone when only that's given", () => {
    expect(text("labour", { dialectCode: { value: "en-GB" } })).toEqual({ value: "labour", dialectCode: { value: "en-GB" } });
  });

  it("carries every applicable format when a word form has more than one rule", () => {
    // Noun.pluralNumberForm's own #1/#2/#3 rules (word_form_part_of_speech_matrix.md).
    expect(text("boxes", { formats: ["/s$/i", "/es$/i"] })).toEqual({ value: "boxes", formats: ["/s$/i", "/es$/i"] });
  });
});
