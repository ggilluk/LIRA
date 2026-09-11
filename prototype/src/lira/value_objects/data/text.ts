import { LanguageCode } from "./code/languageCode";
import { DialectCode } from "./code/dialectCode";
import { ScriptCode } from "./code/scriptCode";
import { LanguageStyleCode } from "./code/languageStyleCode";
import { dialectCodelistFromCode } from "./enum/dialectCodelist";
import { languageCodelistFromCode } from "./enum/languageCodelist";
import { LanguageStyleCodelist } from "./enum/languageStyleCodelist";
import { scriptCodelistFromCode } from "./enum/scriptCodelist";

/** Text. Type, per the UN/CEFACT Core Components Technical Specification.
 *
 * `languageCode`, `scriptCode`, `dialectCode`, `languageStyleCode`,
 * `version`, and `formats` are this prototype's own additions (no
 * Python/spec equivalent) -- each one a fact about this one specific
 * text value (which language it's written in, which script it's
 * rendered in, which regional/social variety it belongs to, which
 * register/style of use it belongs to, which revision of it this is,
 * which spelling pattern it's expected to satisfy), not a fact about
 * whatever entity happens to hold it, so they live on the value
 * itself rather than on that entity -- one shared, reusable shape any
 * Text-typed field anywhere can opt into (Word/Phrase's own former
 * top-level `version`/`languageCode`/`dialectCodes`/`registerCodes`
 * fields, vocabulary/documentation/architecture/data_entity_design_decisions_log.md,
 * folded onto their own `lexicalForm`/base-lemma-WordForm `Text` for
 * exactly this reason).
 *
 * `languageCode` specialises the CCTS language identifier using ISO 639-1.
 * `dialectCode` is LIRA's language-variety specialisation using IANA BCP 47
 * variant subtags because UN/CEFACT does not publish a separate dialect list.
 * `scriptCode` uses ISO 15924. `languageStyleCode` is LIRA's own register/
 * style code list (formal, informal, slang, ...) -- no external standard
 * exists for this either. Each specialised Code retains the external
 * standards code (where one exists) as CCTS Code content, plus a Codelist
 * identity for later tensor/graph operations (`LanguageCode`/`DialectCode`/
 * `ScriptCode`/`LanguageStyleCode`, data/code/*.ts).
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
  languageStyleCode?: LanguageStyleCode;
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

// -- Text metadata resolution -----------------------------------------
// One resolver per Text field above that specialises a raw external
// code into its own Codelist-backed Code type -- moved here from
// vocabulary/role/processor/word_processor.ts, which needed all four only to
// populate these same Text fields and had no Word-specific reason to
// own them (unlike the regular-English-suffix spelling primitives that
// were briefly moved here alongside them and then moved back --
// word_processor.ts's own docstring on why those genuinely are
// Word-subtype-shared logic, not Text-generic primitives, despite
// having an identical `string`-in-`string`/`Text`-out shape to these
// four). Value-object helper functions for Text live directly in this
// file, the same convention text()/textToLowerCase()/textToUpperCase()
// above already establish -- Text has no separate role/text_processor.ts
// the way a Vocabulary-layer entity (Word, WordForm, ...) gets one,
// since a plain value object's own behaviour is small enough to sit
// beside its shape.

/** `code`'s own ISO 639-1 `LanguageCode` -- every real caller passes a
 * WordSeeder's own configured language code, always "en" today, but
 * this resolves whatever ISO 639-1 code is actually configured, not
 * just English. Throws for an unrecognised code rather than guessing --
 * a wrong guess would be a silently mislabelled language, not just a
 * missing WordForm. */
export function languageCodeFor(code: string): LanguageCode {
  const codelist = languageCodelistFromCode(code);
  if (codelist === undefined) throw new Error(`no ISO 639-1 LanguageCodelist member for language code '${code}'`);
  return new LanguageCode(codelist);
}

/** `code`'s own IANA variant-subtag `DialectCode` -- unlike
 * languageCodeFor() above, undefined for a `code` that names no known
 * variant subtag, rather than throwing: dialect data is curated,
 * optional, sourced from the Common Vocabulary Cache's own free-text
 * `dialect_codes` entries, not a closed set every value is guaranteed
 * to belong to the way a WordSeeder's own configured language always
 * is. */
export function dialectCodeFor(code: string): DialectCode | undefined {
  const codelist = dialectCodelistFromCode(code);
  return codelist !== undefined ? new DialectCode(codelist) : undefined;
}

/** `code`'s own ISO 15924 `ScriptCode` -- every real caller passes
 * `entry.script_code`, always "Latn" today, but this resolves whatever
 * ISO 15924 alpha-4 code is actually present. Undefined for an
 * unrecognised code, matching dialectCodeFor()'s own "asset-sourced,
 * don't throw" treatment above -- unlike languageCodeFor()'s own
 * configured-and-guaranteed code. */
export function scriptCodeFor(code: string): ScriptCode | undefined {
  const codelist = scriptCodelistFromCode(code);
  return codelist !== undefined ? new ScriptCode(codelist) : undefined;
}

/** `code`'s own `LanguageStyleCode` -- every real caller passes
 * `entry.register_codes`' own first entry, sourced from the Common
 * Vocabulary Cache's own curated `register_codes` list, dialectCodeFor()'s
 * own "asset-sourced, don't throw" treatment above: undefined for a
 * `code` that names no known `LanguageStyleCodelist` member, rather
 * than throwing. `LanguageStyleCodelist` is a string enum whose own
 * keys equal their values (this list has no external standard to
 * translate through, `LanguageStyleCode`'s own docstring), so
 * membership is checked directly rather than via a separate
 * `xCodelistFromCode()` reverse-lookup function the way
 * `dialectCodeFor()`/`scriptCodeFor()` need for their own numeric
 * lists. */
export function languageStyleCodeFor(code: string): LanguageStyleCode | undefined {
  return code in LanguageStyleCodelist ? new LanguageStyleCode(LanguageStyleCodelist[code as keyof typeof LanguageStyleCodelist]) : undefined;
}
