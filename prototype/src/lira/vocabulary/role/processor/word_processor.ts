/** The behavior that operates on a bare Word (data/entities/word.ts) --
 * construction/copying, definition-word breakdown, and the regular-
 * English-suffix spelling primitives every open-class POS subtype's own
 * processor (role/processor/*.ts) builds its own generate<Class>Forms()
 * from.
 *
 * This file is `Word`'s own base-class counterpart to each POS
 * subtype's own role/processor/*_processor.ts -- Word itself isn't one
 * of the 11 POS subtypes those live in, but role/processor/ now holds
 * every entity's own processor, not just the POS subtypes': this file,
 * role/processor/sense_processor.ts, and role/processor/word_form_processor.ts
 * moved in alongside them (role/word_seeder.ts and
 * role/dictionary_processor.ts remain top-level role/ files -- they
 * operate across many entities at once, seeding/hydration-time
 * concerns, not one entity's own construction/copy/identity the way
 * every file under role/processor/ does). What still sets this file
 * apart from every other processor under role/processor/ is the "base
 * class" role explained below -- that's why the spelling primitives
 * belong here and not in value_objects/data/text.ts (briefly tried,
 * then reverted): every one of `Word`'s peer entities in this codebase
 * (WordForm, Sense, Coordination, Domain) is a leaf with no subtypes of
 * its own, so their own role/<entity>_processor.ts files correctly hold
 * nothing but construction/copy/identity -- there is no such thing as
 * "logic shared across WordForm's subtypes" because WordForm has none.
 * `Word` is the one entity here with a real subtype family (Noun/Verb/
 * Adjective/Adverb/... in role/processor/), and this file is where
 * logic shared *across that family* belongs, the same reason a base
 * class holds a method four subclasses would otherwise each
 * reimplement -- "lives here once rather than duplicated across those
 * four files" (noun.ts/verb.ts/adjective.ts/adverb.ts's own
 * generate<Class>Forms()) was always the right home for these, measured
 * against the correct convention (the base of a subtype hierarchy, not
 * a leaf entity's processor). Each function's own type signature
 * (`string` in, `boolean`/`string`/`Text` out, no `Word` anywhere)
 * looks identical to a generic Text primitive, but what makes a
 * function belong here is who reuses it across the family, not what
 * type it happens to pass through.
 *
 * The four Text-metadata code resolvers (languageCodeFor() and its
 * three siblings) are the one group from this file's own former
 * grab-bag that did move to value_objects/data/text.ts and stayed
 * there: unlike the spelling primitives, no POS subtype processor ever
 * called them -- only word_seeder.ts and dictionary_hydrator.ts do, at
 * ingestion time, entirely outside the subtype-processor family this
 * file exists to serve. They were never shared-across-subtypes logic,
 * just riding along in the same file for the same one-time-import
 * convenience.
 *
 * Word Form to Part of Speech Matrix attribute validation
 * (`WordFormIssue`/`createFormatPatternRegExp()`/`recogniseFormTextIssue()`) has also
 * left this file, for the same reason the code resolvers did: every
 * real call site validates one WordForm's own `formType`/`text`, not
 * anything Word-subtype-family-wide, so that's WordForm's own
 * behaviour, not a base-class concern this file should hold. It now
 * lives in role/processor/word_form_processor.ts (that file's own docstring).
 * Briefly kept here on a "proximity to a one-time createWord import"
 * argument before this move -- rejected on reflection, since that
 * reasoning would justify parking almost anything in whichever file
 * happens to already be imported nearby.
 *
 * Known, approved exception to the usual data/-depends-on-role/-never
 * rule (data/entities/word.ts's own docstring; the word_forms.ts fix,
 * commit d087fee): data/entities/phrase.ts's own phraseAsWord() and
 * data/dictionary.ts both call createWord()/createFreshUuidWordCopy()
 * directly, so both real data/ files end up importing from here. This
 * was surfaced and explicitly accepted rather than routed around --
 * createWord()/createFreshUuidWordCopy() are Word's own base-entity
 * constructor/copier, needed by data-layer code that builds or
 * duplicates Word-shaped values, the exact same reason every one of the
 * 11 POS processors already needs them too. */

import { identifier, randomGraphUuid, type Text } from "../../../value_objects";
import type { Dictionary } from "../../data/dictionary";
import type { DefinitionWordReference } from "../../data/definition_word_reference";
import type { Word } from "../../data/entities/word";

// Splits a definition's prose into its own word tokens -- deliberately a
// local regex, not a Linguistics-Layer LinguisticLexer import: Vocabulary
// must not depend on Linguistics (Linguistics depends on Vocabulary, via
// Word), and recogniseDefinitionWords() only needs "the words in this string",
// not sentence/grammar structure. Same pattern as
// external_dictionary_adapter.ts's wordTerms().
const DEFINITION_WORD_PATTERN = /[^\W_]+/g;

function recogniseDefinitionTokens(definitionText: string): string[] {
  return definitionText.replace(/-/g, " ").match(DEFINITION_WORD_PATTERN) ?? [];
}

export type WordInit = Pick<Word, "text" | "partOfSpeech"> & Partial<Omit<Word, "text" | "partOfSpeech">>;

export function createWord(init: WordInit): Word {
  const word: Word = {
    usageNotes: [],
    editorialLabels: [],
    relatedDomainTags: [],
    sourceReferences: [],
    wordFormIds: [],
    isCommon: false,
    isFullyHydrated: true,
    // identifier()'s own auto-assigned `uuid` (value_objects/data/identifier.ts)
    // is this Word's own per-Domain identity -- folded into `wordId`
    // itself now that Identifier carries a `uuid` of its own, no
    // reason for a second Identifier-typed field to exist alongside it
    // (WordForm's own identical fold, role/processor/word_form_processor.ts).
    wordId: init.wordId ?? identifier(crypto.randomUUID()),
    ...init,
  };
  return word;
}

/** A shallow copy of `word`, sharing every field's own object identity
 * except `wordId.uuid`, which becomes a fresh uuid -- `wordId.value`
 * (and every other field) stays the same, so this copy is still
 * recognisably the same underlying Word, just a distinct graph node --
 * the same shape as Python's `copy.copy(word)` followed by a `uuid`
 * reassignment, used by Dictionary.seedFrom and
 * WordSeeder.seedClosedClassWords/loadCache. */
export function createFreshUuidWordCopy(word: Word): Word {
  return { ...word, wordId: { ...word.wordId, uuid: randomGraphUuid() } };
}

/** `word`'s own per-Domain graph identity -- `word.wordId.uuid`,
 * always set for a real Word (createWord()/createFreshUuidWordCopy()
 * above are its only two constructors, and both always assign it);
 * the assertion here just names that guarantee once instead of
 * repeating it at every call site that needs a Word's own identity as
 * a plain string (Dictionary's own byUuid map key, ...).
 * `wordId.value` is the stable, cross-Domain identity -- deliberately
 * not what this reads (data/entities/word.ts's own docstring on the
 * two roles `wordId` now plays). WordForm's own identical
 * graphUuid() (role/processor/word_form_processor.ts). */
export function graphUuid(word: Word): number {
  return word.wordId.uuid!;
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

/** Breaks `definitionText` into its own sequenced array of
 * DefinitionWordReferences, one per token in reading order -- unlike
 * relatedWords, duplicates are kept and position is preserved, since
 * this describes a sentence, not a set of related Words. Empty when
 * `definitionText` is undefined.
 *
 * Takes the definition `Text` directly rather than a `Word` to read it
 * from -- Word carries no `definition` of its own any more (Sense's own
 * docstring on why); the caller resolves it through the Word's own
 * primary Sense first (ui/server/resolver_domain.ts's own
 * senseFieldsFor(), role/dictionary_processor.ts's own
 * createDefinitionHydrationRequests()), keeping this function itself free of a
 * Senses/WordForms dependency it would otherwise need just to read one
 * field.
 *
 * Each token is resolved against `dictionary` domain-first: every
 * same-text candidate `Dictionary.lookupAll` returns, preferring one
 * with `isCommon=false` if any exists, else falling back to
 * lookupAll's own first-seeded order. A token with no candidate at all
 * resolves to `word=undefined`, reported rather than guessed. */
export function recogniseDefinitionWords(definitionText: Text | undefined, dictionary: Dictionary): readonly DefinitionWordReference[] {
  if (definitionText === undefined) return [];
  const references: DefinitionWordReference[] = [];
  for (const token of recogniseDefinitionTokens(definitionText.value)) {
    const candidates = dictionary.lookupAll(token);
    const resolved = candidates.length > 0 ? (candidates.find((w) => !w.isCommon) ?? candidates[0]) : undefined;
    references.push({ text: token, word: resolved });
  }
  return references;
}

// -- Regular English suffix generation, shared by every open-class POS
// subtype's own generate<Class>Forms() (noun.ts, verb.ts, adjective.ts,
// adverb.ts) -- pure spelling heuristics, not part-of-speech-specific
// (a doubled final consonant works the same way whether it's feeding
// "-ed"/"-ing" or "-er"/"-est"), so the mechanism lives here once rather
// than duplicated across those four files. Each generator itself
// (noun.ts's createPluralNumberForm, ...) stays in its own class
// file -- what's shared is only "is this lemma safe to double", not any
// per-field decision of what to actually build from that answer.

/** The lemma ends in a consonant immediately before a final "y"
 * ("try", "happy") -- the precondition every *_Form generator checks
 * before its own "y" -> "ies"/"ied"/"ier"/"iest" branch (a lemma ending
 * in a *vowel* + "y", like "play"/"grey", takes the plain "-s"/"-ed"/...
 * suffix instead: "plays", not "plaies"). */
export function isConsonantYEnding(word: string): boolean {
  return /[^aeiou]y$/i.test(word);
}

/** Porter Stemmer's own "cvc" test (Porter, 1980): the lemma ends
 * consonant-vowel-consonant, where that final consonant is not w, x, or
 * y (English never doubles those: "row" -> "rowed", "fix" -> "fixed",
 * "play" -> "played"). */
function isCvcEnding(word: string): boolean {
  return /(^|[^aeiou])[aeiou][bcdfghjklmnprstvz]$/i.test(word);
}

/** A purely orthographic proxy for "one syllable" -- counts contiguous
 * vowel-letter runs (`y` deliberately excluded; isConsonantYEnding()
 * above is the branch that already handles a lemma ending in "y", so a
 * word reaching this check never needs `y` treated as a vowel of its
 * own) and treats exactly one as "monosyllabic enough to trust". Not
 * real syllabification (a vowel digraph can still throw the count off
 * for some words), but recogniseFinalConsonantDoublingStrategy() below only ever
 * uses this to decide whether to double a final consonant, and only
 * when it returns true -- an overcount would wrongly withhold doubling
 * from a genuine monosyllable, never wrongly apply it to one, so the
 * only failure mode this lets through is the safe one. */
function isMonosyllabic(word: string): boolean {
  return (word.match(/[aeiou]+/gi) ?? []).length === 1;
}

/** recogniseFinalConsonantDoublingStrategy()'s own Exception Lookup for the one
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
 * IRREGULAR_VERB_FORMS's own docstring already gives for a different
 * problem (verb_processor.ts) -- this one's for stress, not irregular
 * spelling, but the same principle: only add what's genuinely
 * uncontroversial, leave the rest exactly as undecided as before. */
const NON_DOUBLING_MULTISYLLABLE_VERBS: ReadonlySet<string> = new Set([
  "happen", "open", "enter", "answer", "offer", "suffer", "gather", "listen",
  "differ", "wonder", "murder", "order", "cover", "discover", "remember",
  "consider", "deliver", "visit", "limit", "profit", "benefit", "develop", "gossip",
]);

/** Whether a *_Form generator should double `word`'s own final
 * consonant before appending a regular suffix ("run" -> "running",
 * "big" -> "bigger") -- true only when the lemma both ends
 * consonant-vowel-consonant (isCvcEnding()) AND is monosyllabic by the
 * heuristic above; "abstain" for a lemma that ends CVC but isn't
 * (heuristically) monosyllabic, since real English doubling for a
 * longer word depends on which syllable is stressed, not just spelling
 * -- "occur" -> "occurred" doubles, "differ" -> "differed" doesn't, and
 * both pass the identical CVC spelling test -- except
 * NON_DOUBLING_MULTISYLLABLE_VERBS above, checked first: a small,
 * hand-verified carve-out of that same abstention for lemmas this
 * function can resolve with real confidence rather than guess. Every
 * regular-suffix generator that calls this (verb_processor.ts's
 * createRegularEdForm/createRegularIngForm, this file's own createRegularDegreeForm
 * below) treats "not double, and not a CVC lemma at all either" as the
 * ordinary plain-suffix case, and "ends CVC but isn't monosyllabic, and
 * not in the carve-out" as an outright abstention -- the matrix's own
 * Required Linguistic Data for every rule this backs ("Syllable Count;
 * Stress Pattern; Final Phoneme/Letter Pattern",
 * word_form_part_of_speech_matrix.md) isn't data this codebase has for
 * any WordNet-seeded Word today, so guessing wrong is the one outcome
 * every caller here deliberately avoids. */
export function recogniseFinalConsonantDoublingStrategy(word: string): "double" | "abstain" | "plain" {
  if (!isCvcEnding(word)) return "plain";
  if (NON_DOUBLING_MULTISYLLABLE_VERBS.has(word.toLowerCase())) return "plain";
  return isMonosyllabic(word) ? "double" : "abstain";
}

/** Adjective.comparativeDegreeForm/superlativeDegreeForm's own
 * Generation Transform (word_form_part_of_speech_matrix.md), and
 * Adverb's identical counterpart -- shared here since the two classes'
 * own degree paradigm is spelled exactly the same way, rather than
 * duplicated in both adjective.ts and adverb.ts. Returns undefined only
 * for recogniseFinalConsonantDoublingStrategy()'s own "abstain" case (word_form_part_of_speech_matrix.md's
 * own rule #5, an irregular comparative/superlative like "good" ->
 * "better", is a second, separate reason no value is ever generated for
 * those lemmas -- there's no spelling signal to detect an irregular
 * lemma at all, so this function is never even called for one; every
 * lemma it IS called for is presumed regular). Callers must only reach
 * this for a lemma isPeriphrasticComparison() below has already ruled
 * OUT of periphrastic comparison -- it has no opinion of its own on
 * synthetic vs. periphrastic, only on which synthetic spelling rule
 * applies once synthetic has already been decided. */
export function createRegularDegreeForm(lemma: string, comparative: boolean): Text | undefined {
  const plainSuffix = comparative ? "er" : "est";
  const eSuffix = comparative ? "r" : "st";
  const ySuffix = comparative ? "ier" : "iest";
  const doubledFormat = comparative
    ? "/([bcdfghjklmnpqrstvwxyz])\\1er$/i"
    : "/([bcdfghjklmnpqrstvwxyz])\\1est$/i";
  if (isConsonantYEnding(lemma)) return { value: `${lemma.slice(0, -1)}${ySuffix}`, formats: [`/${ySuffix}$/i`] };
  if (/e$/i.test(lemma)) return { value: `${lemma}${eSuffix}`, formats: [`/${plainSuffix}$/i`] };
  const doubling = recogniseFinalConsonantDoublingStrategy(lemma);
  if (doubling === "abstain") return undefined;
  if (doubling === "double") return { value: `${lemma}${lemma.slice(-1)}${plainSuffix}`, formats: [doubledFormat] };
  return { value: `${lemma}${plainSuffix}`, formats: [`/${plainSuffix}$/i`] };
}

/** A purely orthographic syllable-count proxy -- contiguous vowel-
 * letter runs (`y` counted as a vowel here, unlike isMonosyllabic()
 * above: by the time a caller reaches this function, isConsonantYEnding()
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
 * recogniseFinalConsonantDoublingStrategy() above already take, scoped to the one
 * question isPeriphrasticComparison() actually needs answered. */
export function recogniseSyllableCount(word: string): number {
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
 * ones) -- called before createRegularDegreeForm() above, never after: which
 * one applies must be settled before any orthographic transformation is
 * attempted (Required Processing Order), not inferred from whichever
 * one happens to produce a well-formed spelling. `false` (synthetic)
 * doesn't guarantee createRegularDegreeForm() actually returns a value --
 * that function can still abstain on its own separate spelling grounds
 * (its own docstring) -- it only means periphrastic comparison is not
 * the right strategy for this lemma. */
export function isPeriphrasticComparison(lemma: string): boolean {
  if (isConsonantYEnding(lemma)) return false;
  const syllables = recogniseSyllableCount(lemma);
  if (syllables <= 1) return false;
  if (syllables === 2 && SYNTHETIC_TWO_SYLLABLE_ENDINGS.test(lemma)) return false;
  return true;
}

/** Adjective.comparativeDegreeForm/superlativeDegreeForm's own
 * periphrastic Generation Transform -- only ever called once
 * isPeriphrasticComparison() above has already said `true`. Unlike
 * createRegularDegreeForm(), never abstains: "more"/"most" prefixing has no
 * spelling precondition of its own, the way doubling a final consonant
 * does. */
export function createPeriphrasticDegreeForm(lemma: string, comparative: boolean): Text {
  const adverb = comparative ? "more" : "most";
  const format = comparative ? "/^more\\s+.+$/i" : "/^most\\s+.+$/i";
  return { value: `${adverb} ${lemma}`, formats: [format] };
}
