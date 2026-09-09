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
// vocabulary/role/word_processor.ts (that file's own docstring
// history), which needed all four only to populate these same Text
// fields and had no Word-specific reason to own them. Value-object
// helper functions for Text live directly in this file, the same
// convention text()/textToLowerCase()/textToUpperCase() above already
// establish -- Text has no separate role/text_processor.ts the way a
// Vocabulary-layer entity (Word, WordForm, ...) gets one, since a plain
// value object's own behaviour is small enough to sit beside its shape.

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

// -- Regular English suffix generation ---------------------------------
// Pure spelling primitives, shared by every open-class Vocabulary-layer
// POS subtype's own generate<Class>Forms() (noun.ts, verb.ts,
// adjective.ts, adverb.ts) -- moved here from
// vocabulary/role/word_processor.ts for the identical reason the code
// resolvers above were: none of them take or return a Word, only a
// plain `string` lemma and (for the two degree-form generators) a
// `Text` result, so they're primitives about spelling English text, not
// about the Vocabulary layer's own Word entity. A doubled final
// consonant works the same way whether it's feeding "-ed"/"-ing" or
// "-er"/"-est", so the mechanism lives here once rather than
// duplicated across those four files. Each generator itself
// (noun.ts's generatedPluralNumberForm, ...) stays in its own class
// file -- what's shared is only "is this lemma safe to double", not any
// per-field decision of what to actually build from that answer.

/** The lemma ends in a consonant immediately before a final "y"
 * ("try", "happy") -- the precondition every *_Form generator checks
 * before its own "y" -> "ies"/"ied"/"ier"/"iest" branch (a lemma ending
 * in a *vowel* + "y", like "play"/"grey", takes the plain "-s"/"-ed"/...
 * suffix instead: "plays", not "plaies"). */
export function endsInConsonantY(word: string): boolean {
  return /[^aeiou]y$/i.test(word);
}

/** Porter Stemmer's own "cvc" test (Porter, 1980): the lemma ends
 * consonant-vowel-consonant, where that final consonant is not w, x, or
 * y (English never doubles those: "row" -> "rowed", "fix" -> "fixed",
 * "play" -> "played"). */
function endsInCvc(word: string): boolean {
  return /(^|[^aeiou])[aeiou][bcdfghjklmnprstvz]$/i.test(word);
}

/** A purely orthographic proxy for "one syllable" -- counts contiguous
 * vowel-letter runs (`y` deliberately excluded; endsInConsonantY()
 * above is the branch that already handles a lemma ending in "y", so a
 * word reaching this check never needs `y` treated as a vowel of its
 * own) and treats exactly one as "monosyllabic enough to trust". Not
 * real syllabification (a vowel digraph can still throw the count off
 * for some words), but shouldDoubleFinalConsonant() below only ever
 * uses this to decide whether to double a final consonant, and only
 * when it returns true -- an overcount would wrongly withhold doubling
 * from a genuine monosyllable, never wrongly apply it to one, so the
 * only failure mode this lets through is the safe one. */
function isMonosyllabic(word: string): boolean {
  return (word.match(/[aeiou]+/gi) ?? []).length === 1;
}

/** shouldDoubleFinalConsonant()'s own Exception Lookup for the one
 * narrow sliver of its "ends CVC but isn't monosyllabic" abstention it
 * can resolve with confidence -- a closed, hand-verified set of common
 * English verbs whose stress is unambiguously *not* on their final
 * syllable ("HAP-pen", never "hap-PEN") and which carry no British/
 * American spelling variant either (unlike the real, much larger
 * "-el"-ending class -- "cancel"/"travel"/"label"/"model"/"signal", GB
 * "cancelled" vs US "canceled" -- deliberately left abstaining, since
 * picking either spelling here would be a dialect choice this codebase
 * has no basis to make). Found by enumerating every real bundled
 * WordNet VERB lemma this function's own "abstain" branch actually
 * reaches (1,007 of them) and hand-verifying stress for this subset
 * alone against ordinary English pronunciation -- not an attempt at the
 * other ~980 (many genuinely ambiguous, dialectal, or both), the same
 * "closed, well-known set... not an open curation project" reasoning
 * IRREGULAR_VERB_FORMS's own docstring gives for a different problem
 * (vocabulary/role/processor/verb_processor.ts) -- this one's for
 * stress, not irregular spelling, but the same principle: only add what's
 * genuinely uncontroversial, leave the rest exactly as undecided as
 * before. */
const NON_DOUBLING_MULTISYLLABLE_VERBS: ReadonlySet<string> = new Set([
  "happen", "open", "enter", "answer", "offer", "suffer", "gather", "listen",
  "differ", "wonder", "murder", "order", "cover", "discover", "remember",
  "consider", "deliver", "visit", "limit", "profit", "benefit", "develop", "gossip",
]);

/** Whether a *_Form generator should double `word`'s own final
 * consonant before appending a regular suffix ("run" -> "running",
 * "big" -> "bigger") -- true only when the lemma both ends
 * consonant-vowel-consonant (endsInCvc()) AND is monosyllabic by the
 * heuristic above; "abstain" for a lemma that ends CVC but isn't
 * (heuristically) monosyllabic, since real English doubling for a
 * longer word depends on which syllable is stressed, not just spelling
 * -- "occur" -> "occurred" doubles, "differ" -> "differed" doesn't, and
 * both pass the identical CVC spelling test -- except
 * NON_DOUBLING_MULTISYLLABLE_VERBS above, checked first: a small,
 * hand-verified carve-out of that same abstention for lemmas this
 * function can resolve with real confidence rather than guess. Every
 * regular-suffix generator that calls this
 * (vocabulary/role/processor/verb_processor.ts's regularEdForm/regularIngForm,
 * regularDegreeForm() below) treats "not double, and not a CVC lemma at
 * all either" as the ordinary plain-suffix case, and "ends CVC but
 * isn't monosyllabic, and not in the carve-out" as an outright
 * abstention -- the Word Form to Part of Speech Matrix's own Required
 * Linguistic Data for every rule this backs ("Syllable Count; Stress
 * Pattern; Final Phoneme/Letter Pattern",
 * vocabulary/data/matrices/word_form_part_of_speech_matrix.md) isn't
 * data this codebase has for any WordNet-seeded Word today, so guessing
 * wrong is the one outcome every caller here deliberately avoids. */
export function shouldDoubleFinalConsonant(word: string): "double" | "abstain" | "plain" {
  if (!endsInCvc(word)) return "plain";
  if (NON_DOUBLING_MULTISYLLABLE_VERBS.has(word.toLowerCase())) return "plain";
  return isMonosyllabic(word) ? "double" : "abstain";
}

/** Adjective.comparativeDegreeForm/superlativeDegreeForm's own
 * Generation Transform (vocabulary/data/matrices/word_form_part_of_speech_matrix.md),
 * and Adverb's identical counterpart -- shared here since the two
 * classes' own degree paradigm is spelled exactly the same way, rather
 * than duplicated in both adjective.ts and adverb.ts. Returns undefined
 * only for shouldDoubleFinalConsonant()'s own "abstain" case (that
 * doc's own rule #5, an irregular comparative/superlative like "good"
 * -> "better", is a second, separate reason no value is ever generated
 * for those lemmas -- there's no spelling signal to detect an irregular
 * lemma at all, so this function is never even called for one; every
 * lemma it IS called for is presumed regular). Callers must only reach
 * this for a lemma isPeriphrasticComparison() below has already ruled
 * OUT of periphrastic comparison -- it has no opinion of its own on
 * synthetic vs. periphrastic, only on which synthetic spelling rule
 * applies once synthetic has already been decided. */
export function regularDegreeForm(lemma: string, comparative: boolean): Text | undefined {
  const plainSuffix = comparative ? "er" : "est";
  const eSuffix = comparative ? "r" : "st";
  const ySuffix = comparative ? "ier" : "iest";
  const doubledFormat = comparative
    ? "/([bcdfghjklmnpqrstvwxyz])\\1er$/i"
    : "/([bcdfghjklmnpqrstvwxyz])\\1est$/i";
  if (endsInConsonantY(lemma)) return { value: `${lemma.slice(0, -1)}${ySuffix}`, formats: [`/${ySuffix}$/i`] };
  if (/e$/i.test(lemma)) return { value: `${lemma}${eSuffix}`, formats: [`/${plainSuffix}$/i`] };
  const doubling = shouldDoubleFinalConsonant(lemma);
  if (doubling === "abstain") return undefined;
  if (doubling === "double") return { value: `${lemma}${lemma.slice(-1)}${plainSuffix}`, formats: [doubledFormat] };
  return { value: `${lemma}${plainSuffix}`, formats: [`/${plainSuffix}$/i`] };
}

/** A purely orthographic syllable-count proxy -- contiguous vowel-
 * letter runs (`y` counted as a vowel here, unlike isMonosyllabic()
 * above: by the time a caller reaches this function, endsInConsonantY()
 * has already claimed every lemma ending consonant+y for its own
 * "-ier"/"-iest" rule, so any `y` isPeriphrasticComparison() below still
 * sees is medial, e.g. "syllable", and does belong in the count), with a
 * bare final "e" not counted as its own syllable ("large" is one
 * syllable, not two). Not real syllabification (a vowel digraph like
 * "ea"/"ou" still collapses to one run, which is usually but not always
 * right), but the Matrix's own Required Linguistic Data for the
 * comparison-strategy choice ("Degree Strategy Classification") isn't
 * real curated data this codebase has, so this is the same "best
 * available spelling signal" approach isMonosyllabic()/
 * shouldDoubleFinalConsonant() above already take, scoped to the one
 * question isPeriphrasticComparison() actually needs answered. */
export function syllableCount(word: string): number {
  const trimmed = /[^aeiou]e$/i.test(word) ? word.slice(0, -1) : word;
  const runs = trimmed.match(/[aeiouy]+/gi) ?? [];
  return Math.max(runs.length, 1);
}

// A monosyllabic lemma always takes "-er"/"-est"; a two-syllable lemma
// still does when it ends in one of these (English's own real
// exceptions to "long words use more/most" -- "narrow" -> "narrower",
// not "more narrow"; "gentle" -> "gentler"; "clever" -> "cleverer").
// Every other two-syllable lemma, and every lemma of three or more
// syllables, takes periphrastic comparison instead ("beautiful" ->
// "more beautiful", never "beautifuler").
const SYNTHETIC_TWO_SYLLABLE_ENDINGS = /(er|le|ow)$/i;

/** Adjective.comparativeDegreeForm/superlativeDegreeForm's own
 * Comparison Type decision -- English's two mutually exclusive degree
 * strategies (word_form_part_of_speech_matrix.md's own "Comparative/
 * Superlative Periphrastic Form" rows: "more beautiful"/"most
 * beautiful" for longer adjectives, alongside "-er"/"-est" for shorter
 * ones) -- called before regularDegreeForm() above, never after: which
 * one applies must be settled before any orthographic transformation is
 * attempted (Required Processing Order), not inferred from whichever
 * one happens to produce a well-formed spelling. `false` (synthetic)
 * doesn't guarantee regularDegreeForm() actually returns a value --
 * that function can still abstain on its own separate spelling grounds
 * (its own docstring) -- it only means periphrastic comparison is not
 * the right strategy for this lemma. */
export function isPeriphrasticComparison(lemma: string): boolean {
  if (endsInConsonantY(lemma)) return false;
  const syllables = syllableCount(lemma);
  if (syllables <= 1) return false;
  if (syllables === 2 && SYNTHETIC_TWO_SYLLABLE_ENDINGS.test(lemma)) return false;
  return true;
}

/** Adjective.comparativeDegreeForm/superlativeDegreeForm's own
 * periphrastic Generation Transform -- only ever called once
 * isPeriphrasticComparison() above has already said `true`. Unlike
 * regularDegreeForm(), never abstains: "more"/"most" prefixing has no
 * spelling precondition of its own, the way doubling a final consonant
 * does. */
export function periphrasticDegreeForm(lemma: string, comparative: boolean): Text {
  const adverb = comparative ? "more" : "most";
  const format = comparative ? "/^more\\s+.+$/i" : "/^most\\s+.+$/i";
  return { value: `${adverb} ${lemma}`, formats: [format] };
}
