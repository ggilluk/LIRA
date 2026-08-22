/** The behavior that operates on a bare Word (data/entities/word.ts) --
 * construction/copying, definition-word breakdown, Word Form to Part of
 * Speech Matrix validation, and the regular-English-suffix spelling
 * primitives every open-class POS subtype's own processor
 * (role/processor/*.ts) builds its own generate<Class>Forms() from. The
 * base-class counterpart to each POS subtype's own role/processor/*_processor.ts
 * -- Word itself isn't one of the 11 POS subtypes those live in, so this
 * file is a sibling of role/word_seeder.ts and role/dictionary_processor.ts,
 * not a member of role/processor/.
 *
 * Known, approved exception to the usual data/-depends-on-role/-never
 * rule (data/entities/word.ts's own docstring; the word_forms.ts fix,
 * commit d087fee): data/phrase.ts's own phraseAsWord() and
 * data/dictionary.ts both call createWord()/copyWordWithFreshUuid()
 * directly, so both real data/ files end up importing from here. This
 * was surfaced and explicitly accepted rather than routed around --
 * createWord()/copyWordWithFreshUuid() are Word's own base-entity
 * constructor/copier, needed by data-layer code that builds or
 * duplicates Word-shaped values, the exact same reason every one of the
 * 11 POS processors already needs them too. */

import type { Text } from "../../value_objects";
import type { Dictionary } from "../data/dictionary";
import type { DefinitionWordReference } from "../data/definition_word_reference";
import type { Word } from "../data/entities/word";
import { newUuid } from "../data/uuid";

// Splits a definition's prose into its own word tokens -- deliberately a
// local regex, not a Linguistics-Layer LinguisticLexer import: Vocabulary
// must not depend on Linguistics (Linguistics depends on Vocabulary, via
// Word), and definitionWords() only needs "the words in this string",
// not sentence/grammar structure. Same pattern as
// external_dictionary_adapter.ts's wordTerms().
const DEFINITION_WORD_PATTERN = /[^\W_]+/g;

function definitionTokens(definitionText: string): string[] {
  return definitionText.replace(/-/g, " ").match(DEFINITION_WORD_PATTERN) ?? [];
}

export type WordInit = Pick<Word, "text" | "partOfSpeech"> & Partial<Omit<Word, "text" | "partOfSpeech">>;

export function createWord(init: WordInit): Word {
  const word: Word = {
    pronunciations: [],
    usageNotes: [],
    registerCodes: [],
    dialectCodes: [],
    editorialLabels: [],
    relatedDomainTags: [],
    sourceReferences: [],
    senseIds: [],
    contractionOf: [],
    formIds: [],
    isCommon: false,
    isFullyHydrated: true,
    isRootWord: false,
    isDerivableNoun: false,
    uuid: init.uuid ?? { value: newUuid() },
    entryId: init.entryId ?? { value: newUuid() },
    version: init.version ?? { value: "1.0" },
    languageCode: init.languageCode ?? { value: "en" },
    ...init,
  };
  if (word.lexicalForm === undefined) word.lexicalForm = { value: word.text };
  if (word.normalisedForm === undefined) word.normalisedForm = { value: word.text.toLowerCase() };
  return word;
}

/** A shallow copy of `word`, sharing every field's own object identity
 * except `uuid`, which becomes a fresh Identifier -- the same shape as
 * Python's `copy.copy(word)` followed by a `uuid` reassignment, used by
 * Dictionary.seedFrom and WordSeeder.seedClosedClassWords/loadCache. */
export function copyWordWithFreshUuid(word: Word): Word {
  return { ...word, uuid: { value: newUuid() } };
}

// -- Derived properties (4.3) --------------------------------------
// The relationship-accessor family that used to live here (lemmaForms,
// inflections, morphologicalVariants, derivedForms, synonyms, antonyms,
// hypernyms, hyponyms, meronyms, holonyms, troponyms, spellingVariants,
// abbreviations, acronyms, contractions, transliterations,
// relatedWordsOf) queried a LexicalRelationshipStore directly -- removed
// along with that store's own retirement from the permanent queryable
// model (VocabularyContext's own docstring, data/vocabulary_context.ts, on the split:
// it's seeding-internal working state now). None of these 16 functions
// had a real production caller left (grep-verified against the whole
// src tree, tests aside) by the time of that split -- every fact they
// used to expose already has its own permanent home now: a genuine
// SemanticRelationship for a true sense-to-sense semantic fact
// (data/semantic_relationship.ts), Senses.membersOf() directly for
// synonymy (sharing a Sense already *is* being a synonym, no separate
// accessor needed), or a direct POS-class attribute for a morphological/
// orthographic one (isNominalised and its siblings, Word.contractionOf,
// each field's own docstring in data/entities/noun.ts, data/entities/verb.ts,
// data/entities/adjective.ts, data/entities/adverb.ts, data/entities/word.ts).

// -- Definition word breakdown (4.4) ---------------------------------
// Also not a stored field -- computed on demand, like the derived
// properties above -- but resolved directly against a Dictionary
// rather than a LexicalRelationshipStore: a definition is prose about
// this Word, not a claimed relationship between two Words, so there is
// no LexicalRelationship to read.

/** Breaks `word`'s own `definition` text into its own sequenced array
 * of DefinitionWordReferences, one per token in reading order --
 * unlike relatedWords, duplicates are kept and position is preserved,
 * since this describes a sentence, not a set of related Words. Empty
 * when `definition` is undefined.
 *
 * Each token is resolved against `dictionary` domain-first: every
 * same-text candidate `Dictionary.lookupAll` returns, preferring one
 * with `isCommon=false` if any exists, else falling back to
 * lookupAll's own first-seeded order. A token with no candidate at all
 * resolves to `word=undefined`, reported rather than guessed. */
export function definitionWords(word: Word, dictionary: Dictionary): readonly DefinitionWordReference[] {
  if (word.definition === undefined) return [];
  const references: DefinitionWordReference[] = [];
  for (const token of definitionTokens(word.definition.value)) {
    const candidates = dictionary.lookupAll(token);
    const resolved = candidates.length > 0 ? (candidates.find((w) => !w.isCommon) ?? candidates[0]) : undefined;
    references.push({ text: token, word: resolved });
  }
  return references;
}

// -- Word Form to Part of Speech Matrix attribute validation (data/matrices/word_form_part_of_speech_matrix.md) --
// Each POS subtype (noun.ts, verb.ts, ...) owns its own row of the
// matrix's String Pattern column and its own validate<Class>() -- there
// is deliberately no single file holding every class's patterns. What's
// shared here is only the generic mechanism every one of those
// validate<Class>() functions reuses: parsing a `Text.formats` entry
// into a real RegExp, and checking one field's Text against one known
// pattern set. This lives here alongside Word's own createWord(), not
// split out further, because every POS subtype's own processor
// (role/processor/*_processor.ts) already imports from this file for
// `createWord` itself, so this adds no new cross-file dependency.

/** One validation failure from validateFormText/validate<Class> below --
 * `field` is the plain field name (e.g. "pluralNumberForm"), `reason`
 * says which of the two ways a claimed Text.formats entry failed. */
export interface WordFormIssue {
  field: string;
  reason: string;
}

/** Parses one `Text.formats` entry ("/s$/i") into a real RegExp --
 * splits on the *last* "/" as the flags delimiter (none of any POS
 * class's own word-form patterns ever contain a literal "/" in their
 * body, so this is unambiguous for every pattern this codebase actually
 * defines). Throws on a malformed pattern string (no leading "/") --
 * deliberately, since a caller passing one is a programming error, not
 * a validation outcome to report gracefully the way an unrecognised
 * *pattern* (validateFormText's own concern) is. */
export function parseFormatPattern(pattern: string): RegExp {
  if (!pattern.startsWith("/")) throw new Error(`not a "/pattern/flags"-shaped format string: '${pattern}'`);
  const lastSlash = pattern.lastIndexOf("/");
  return new RegExp(pattern.slice(1, lastSlash), pattern.slice(lastSlash + 1));
}

/** Checks one Text value's own `formats` (if set at all -- unset is
 * always valid, the same "no claim made" reading Text.formats's own
 * docstring gives it) against `known`, the calling POS class's own
 * recognised String Patterns for this one field (WORD_FORM_MATRIX's
 * own rules for that (field, PartOfSpeech) pair,
 * data/matrices/pos_vs_wordform_matrice.ts, via that file's
 * own stringPatternsFor()). Two distinct ways to fail: a
 * claimed format isn't one of the patterns this (class, field) pair
 * actually recognises at all (a typo, a pattern copied from the wrong
 * field, or a field the matrix marks fully N/A/lexical, whose own array
 * is always empty); or the claimed format IS recognised, but
 * `text.value` itself doesn't actually match it (stale data -- the
 * value changed after `formats` was set, or the two were never
 * consistent to begin with). */
export function validateFormText(field: string, text: Text, known: readonly string[]): WordFormIssue | undefined {
  if (text.formats === undefined) return undefined;
  for (const claimed of text.formats) {
    if (!known.includes(claimed)) {
      return {
        field,
        reason: `'${claimed}' is not a recognised String Pattern for '${field}' (word_form_part_of_speech_matrix.md)`,
      };
    }
    if (!parseFormatPattern(claimed).test(text.value)) {
      return { field, reason: `'${text.value}' does not match its own claimed format '${claimed}'` };
    }
  }
  return undefined;
}

/** Validates the one *_Form field every POS subtype shares via Word
 * itself: `baseLemmaCanonicalForm`. Fully lexical (that field's own
 * docstring above) -- there is no derivable String Pattern for it at
 * all, so this reports an issue whenever a populated value's own
 * `formats` is set to anything, and nothing otherwise. Every POS
 * subtype's own validate<Class>() (noun.ts, verb.ts, ...) calls this
 * first, then checks its own additional *_Form fields on top. */
export function validateWordFormAttributes(word: Word): readonly WordFormIssue[] {
  if (word.baseLemmaCanonicalForm === undefined) return [];
  const issue = validateFormText("baseLemmaCanonicalForm", word.baseLemmaCanonicalForm, []);
  return issue === undefined ? [] : [issue];
}

// -- Regular English suffix generation, shared by every open-class POS
// subtype's own generate<Class>Forms() (noun.ts, verb.ts, adjective.ts,
// adverb.ts) -- pure spelling heuristics, not part-of-speech-specific
// (a doubled final consonant works the same way whether it's feeding
// "-ed"/"-ing" or "-er"/"-est"), so the mechanism lives here once rather
// than duplicated across those four files. Each generator itself
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

/** Whether a *_Form generator should double `word`'s own final
 * consonant before appending a regular suffix ("run" -> "running",
 * "big" -> "bigger") -- true only when the lemma both ends
 * consonant-vowel-consonant (endsInCvc()) AND is monosyllabic by the
 * heuristic above; "abstain" for a lemma that ends CVC but isn't
 * (heuristically) monosyllabic, since real English doubling for a
 * longer word depends on which syllable is stressed, not just spelling
 * -- "occur" -> "occurred" doubles, "differ" -> "differed" doesn't, and
 * both pass the identical CVC spelling test. Every regular-suffix
 * generator that calls this (verb_processor.ts's regularEdForm/regularIngForm,
 * this file's own regularDegreeForm below) treats "not double, and not a
 * CVC lemma at all either" as the ordinary plain-suffix case, and
 * "ends CVC but isn't monosyllabic" as an outright abstention -- the
 * matrix's own Required Linguistic Data for every rule this backs
 * ("Syllable Count; Stress Pattern; Final Phoneme/Letter Pattern",
 * word_form_part_of_speech_matrix.md) isn't data this codebase has for
 * any WordNet-seeded Word today, so guessing wrong is the one outcome
 * every caller here deliberately avoids. */
export function shouldDoubleFinalConsonant(word: string): "double" | "abstain" | "plain" {
  if (!endsInCvc(word)) return "plain";
  return isMonosyllabic(word) ? "double" : "abstain";
}

/** Adjective.comparativeDegreeForm/superlativeDegreeForm's own
 * Generation Transform (word_form_part_of_speech_matrix.md), and
 * Adverb's identical counterpart -- shared here since the two classes'
 * own degree paradigm is spelled exactly the same way, rather than
 * duplicated in both adjective.ts and adverb.ts. Returns undefined only
 * for shouldDoubleFinalConsonant()'s own "abstain" case (word_form_part_of_speech_matrix.md's
 * own rule #5, an irregular comparative/superlative like "good" ->
 * "better", is a second, separate reason no value is ever generated for
 * those lemmas -- there's no spelling signal to detect an irregular
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
 * right), but the matrix's own Required Linguistic Data for the
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
