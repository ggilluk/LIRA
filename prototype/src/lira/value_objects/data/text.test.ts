import { describe, expect, it } from "vitest";
import { text } from "./text";
import { LanguageCode } from "./code/languageCode";
import { LanguageCodelist } from "./enum/languageCodelist";
import { ScriptCode } from "./code/scriptCode";
import { ScriptCodelist } from "./enum/scriptCodelist";
import { DialectCode } from "./code/dialectCode";
import { DialectCodelist } from "./enum/dialectCodelist";

describe("text", () => {
  it("carries only value when no extra attributes are given", () => {
    expect(text("dogs")).toEqual({ value: "dogs" });
  });

  it("carries languageCode alone when only that's given", () => {
    const languageCode = new LanguageCode(LanguageCodelist.EN_ENGLISH);
    expect(text("dogs", { languageCode })).toEqual({ value: "dogs", languageCode });
  });

  it("carries formats alone when only that's given", () => {
    expect(text("dogs", { formats: ["/s$/i"] })).toEqual({ value: "dogs", formats: ["/s$/i"] });
  });

  it("carries languageCode, scriptCode, version, and formats together when all are given", () => {
    const languageCode = new LanguageCode(LanguageCodelist.EN_ENGLISH);
    const scriptCode = new ScriptCode(ScriptCodelist.LATN_LATIN);
    expect(text("dogs", { languageCode, scriptCode, version: "1.0", formats: ["/s$/i"] })).toEqual({
      value: "dogs",
      languageCode,
      scriptCode,
      version: "1.0",
      formats: ["/s$/i"],
    });
  });

  it("carries dialectCode alone when only that's given", () => {
    const dialectCode = new DialectCode(DialectCodelist.SCOTLAND);
    expect(text("bairn", { dialectCode })).toEqual({ value: "bairn", dialectCode });
  });

  it("carries every applicable format when a word form has more than one rule", () => {
    // Noun.pluralNumberForm's own #1/#2/#3 rules (word_form_part_of_speech_matrix.md).
    expect(text("boxes", { formats: ["/s$/i", "/es$/i"] })).toEqual({ value: "boxes", formats: ["/s$/i", "/es$/i"] });
  });
});
