import type { LanguageCode } from "./code/languageCode";
import type { DialectCode } from "./code/dialectCode";
import type { ScriptCode } from "./code/scriptCode";

/** Text. Type, per the UN/CEFACT Core Components Technical Specification.
 *
 * `languageCode`, `scriptCode`, `dialectCode`, `version`, and `formats`
 * are this prototype's own additions (no Python/spec equivalent) --
 * each one a fact about this one specific text value (which language
 * it's written in, which script it's rendered in, which regional/
 * social variety it belongs to, which revision of it this is, which
 * spelling pattern it's expected to satisfy), not a fact about
 * whatever entity happens to hold it, so they live on the value
 * itself rather than on that entity -- one shared, reusable shape any
 * Text-typed field anywhere can opt into (Word/Phrase's own former
 * top-level `version`/`languageCode`/`dialectCodes` fields, vocabulary/
 * documentation/architecture/data_entity_design_decisions_log.md,
 * folded onto their own `lexicalForm`/base-lemma-WordForm `Text` for
 * exactly this reason).
 *
 * `languageCode` specialises the CCTS language identifier using ISO 639-1.
 * `dialectCode` is LIRA's language-variety specialisation using IANA BCP 47
 * variant subtags because UN/CEFACT does not publish a separate dialect list.
 * `scriptCode` uses ISO 15924. Each specialised Code retains the external
 * standards code as CCTS Code content, plus a numeric Codelist identity for
 * later tensor/graph operations (`LanguageCode`/`DialectCode`/`ScriptCode`,
 * data/code/*.ts).
 *
 * `formats`: the regex pattern(s) this specific Text value's own
 * `value` is expected to satisfy (a Vocabulary Layer word-form Text,
 * say -- vocabulary/data/matrices/word_form_part_of_speech_matrix.md's
 * own String Pattern column, e.g. `["/s$/i"]` for a regular plural).
 * Multiple entries when more than one rule can produce this kind of
 * value (word_form_part_of_speech_matrix.md's own numbered Format/
 * String Pattern rows, e.g. plural's six). Undefined for the
 * overwhelming majority of Text values, which carry no format
 * constraint of their own at all (a gloss, a definition, ...) -- this
 * is opt-in metadata, not a requirement every Text value must
 * satisfy. */
export interface Text {
  value: string;
  languageCode?: LanguageCode;
  scriptCode?: ScriptCode;
  dialectCode?: DialectCode;
  version?: string;
  formats?: readonly string[];
}

export function text(value: string, extra: Omit<Text, "value"> = {}): Text {
  return { value, ...extra };
}

/** `text`'s own `value`, lower-cased. */
export function textToLowerCase(text: Text): string {
  return text.value.toLowerCase();
}

/** `textToLowerCase()`'s own exact counterpart, upper-casing `value`
 * instead. */
export function textToUpperCase(text: Text): string {
  return text.value.toUpperCase();
}
