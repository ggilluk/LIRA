import { describe, expect, it } from "vitest";
import { text } from "./text";

describe("text", () => {
  it("carries only value when neither languageId nor formats is given", () => {
    expect(text("dogs")).toEqual({ value: "dogs" });
  });

  it("carries languageId alone when only that's given", () => {
    expect(text("dogs", "en")).toEqual({ value: "dogs", languageId: "en" });
  });

  it("carries formats alone when only that's given", () => {
    expect(text("dogs", undefined, ["/s$/i"])).toEqual({ value: "dogs", formats: ["/s$/i"] });
  });

  it("carries both languageId and formats when both are given", () => {
    expect(text("dogs", "en", ["/s$/i"])).toEqual({ value: "dogs", languageId: "en", formats: ["/s$/i"] });
  });

  it("carries every applicable format when a word form has more than one rule", () => {
    // Noun.pluralNumberForm's own #1/#2/#3 rules (word_form_part_of_speech_matrix.md).
    expect(text("boxes", undefined, ["/s$/i", "/es$/i"])).toEqual({ value: "boxes", formats: ["/s$/i", "/es$/i"] });
  });
});
