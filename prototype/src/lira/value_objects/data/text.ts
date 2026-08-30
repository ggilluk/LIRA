import type { Code } from "./code";

/** Text. Type, per the UN/CEFACT Core Components Technical Specification
 * (CCTS) Core Component Type catalogue (Layer Summary: Value Objects
 * Layer). Ported from value_objects/data/text.py.
 *
 * `languageCode`, `scriptCode`, `dialectCode`, `version`, and `formats`
 * are this prototype's own additions (no Python/spec equivalent) --
 * each one a fact about this one specific text value (which language
 * it's written in, which script it's rendered in, which regional/
 * social variety it belongs to, which revision of it this is, which
 * spelling pattern it's expected to satisfy), not a fact about
 * whatever entity happens to hold it, so they live on the value
 * itself rather than on that entity -- one shared, reusable shape any
 * Text-typed field anywhere can opt into. `languageCode`/`dialectCode`
 * replace the CCTS spec's own plain `languageID` supplementary
 * component with a full `Code` -- the same value object every other
 * language/script/dialect/list-scoped fact in this codebase already
 * uses (Pronunciation.dialectCode, vocabulary/data/pronunciation.ts,
 * is this exact pattern one level down: a specific pronunciation
 * variant's own dialect, distinct from a whole Word/Phrase's
 * aggregate `dialectCodes` list), richer than a bare string when a
 * caller needs it (a code list identifier, a version of that list,
 * ...).
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
  languageCode?: Code;
  scriptCode?: Code;
  dialectCode?: Code;
  version?: string;
  formats?: readonly string[];
}

export function text(value: string, extra: Omit<Text, "value"> = {}): Text {
  return { value, ...extra };
}
