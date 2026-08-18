/** Text. Type, per the UN/CEFACT Core Components Technical Specification
 * (CCTS) Core Component Type catalogue (Layer Summary: Value Objects
 * Layer). Ported from value_objects/data/text.py.
 *
 * `formats` is this prototype's own addition (no Python/spec
 * equivalent) -- the regex pattern(s) this specific Text value's own
 * `value` is expected to satisfy (a Vocabulary Layer word-form Text,
 * say -- vocabulary/data/word_form_part_of_speech_matrix.md's own
 * String Pattern column, e.g. `["/s$/i"]` for a regular plural), kept
 * on the value itself rather than in a separate lookup table keyed by
 * field name -- one shared, reusable shape any Text-typed field
 * anywhere can opt into, not a Vocabulary-specific concept bolted on
 * one layer up. Multiple entries when more than one rule can produce
 * this kind of value (word_form_part_of_speech_matrix.md's own
 * numbered Format/String Pattern rows, e.g. plural's six). Undefined
 * for the overwhelming majority of Text values, which carry no format
 * constraint of their own at all (a gloss, a definition, ...) -- this
 * is opt-in metadata, not a requirement every Text value must satisfy. */
export interface Text {
  value: string;
  languageId?: string;
  formats?: readonly string[];
}

export function text(value: string, languageId?: string, formats?: readonly string[]): Text {
  return {
    value,
    ...(languageId === undefined ? {} : { languageId }),
    ...(formats === undefined ? {} : { formats }),
  };
}
