/** The behavior that operates on a bare Word (data/entities/word.ts) --
 * construction/copying, definition-word breakdown, and Word Form to
 * Part of Speech Matrix validation. The base-class counterpart to each
 * POS subtype's own role/processor/*_processor.ts -- Word itself isn't
 * one of the 11 POS subtypes those live in, so this file is a sibling
 * of role/word_seeder.ts and role/dictionary_processor.ts, not a member
 * of role/processor/.
 *
 * The Text-metadata code resolvers (languageCodeFor() and its three
 * siblings) and the regular-English-suffix spelling primitives
 * (endsInConsonantY(), shouldDoubleFinalConsonant(), regularDegreeForm(),
 * ...) that used to live here moved to value_objects/data/text.ts --
 * none of them ever took or returned a Word, only a plain `string`/`Text`,
 * so keeping them here was proximity to their one-time-only callers
 * (createWord() itself, this file's own POS-subtype importers), not a
 * genuine Word-entity concern. See that file's own "Text metadata
 * resolution"/"Regular English suffix generation" sections for the
 * functions themselves and the fuller rationale for the move.
 *
 * Known, approved exception to the usual data/-depends-on-role/-never
 * rule (data/entities/word.ts's own docstring; the word_forms.ts fix,
 * commit d087fee): data/entities/phrase.ts's own phraseAsWord() and
 * data/dictionary.ts both call createWord()/copyWordWithFreshUuid()
 * directly, so both real data/ files end up importing from here. This
 * was surfaced and explicitly accepted rather than routed around --
 * createWord()/copyWordWithFreshUuid() are Word's own base-entity
 * constructor/copier, needed by data-layer code that builds or
 * duplicates Word-shaped values, the exact same reason every one of the
 * 11 POS processors already needs them too. */

import { identifier, type Text } from "../../value_objects";
import type { Dictionary } from "../data/dictionary";
import type { DefinitionWordReference } from "../data/definition_word_reference";
import type { Word } from "../data/entities/word";
import { wordFormTypeLabel, type WordFormType } from "../data/enums/word_forms_enum";

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
    // (WordForm's own identical fold, role/word_form_processor.ts).
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
export function copyWordWithFreshUuid(word: Word): Word {
  return { ...word, wordId: { ...word.wordId, uuid: crypto.randomUUID() } };
}

/** `word`'s own per-Domain graph identity -- `word.wordId.uuid`,
 * always set for a real Word (createWord()/copyWordWithFreshUuid()
 * above are its only two constructors, and both always assign it);
 * the assertion here just names that guarantee once instead of
 * repeating it at every call site that needs a Word's own identity as
 * a plain string (Dictionary's own byUuid map key, ...).
 * `wordId.value` is the stable, cross-Domain identity -- deliberately
 * not what this reads (data/entities/word.ts's own docstring on the
 * two roles `wordId` now plays). WordForm's own identical
 * graphUuid() (role/word_form_processor.ts). */
export function graphUuid(word: Word): string {
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
 * queueDefinitionHydration()), keeping this function itself free of a
 * Senses/WordForms dependency it would otherwise need just to read one
 * field.
 *
 * Each token is resolved against `dictionary` domain-first: every
 * same-text candidate `Dictionary.lookupAll` returns, preferring one
 * with `isCommon=false` if any exists, else falling back to
 * lookupAll's own first-seeded order. A token with no candidate at all
 * resolves to `word=undefined`, reported rather than guessed. */
export function definitionWords(definitionText: Text | undefined, dictionary: Dictionary): readonly DefinitionWordReference[] {
  if (definitionText === undefined) return [];
  const references: DefinitionWordReference[] = [];
  for (const token of definitionTokens(definitionText.value)) {
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
 * `field` names which WordFormType the issue is on, `reason` says
 * which of the two ways a claimed Text.formats entry failed (its own
 * message text names `field` via `wordFormTypeLabel()`,
 * data/enums/word_forms_enum.ts, not `field` itself -- a numeric,
 * tensor-coded enum value has no readable text of its own any more). */
export interface WordFormIssue {
  field: WordFormType;
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
export function validateFormText(field: WordFormType, text: Text, known: readonly string[]): WordFormIssue | undefined {
  if (text.formats === undefined) return undefined;
  for (const claimed of text.formats) {
    if (!known.includes(claimed)) {
      return {
        field,
        reason: `'${claimed}' is not a recognised String Pattern for '${wordFormTypeLabel(field)}' (word_form_part_of_speech_matrix.md)`,
      };
    }
    if (!parseFormatPattern(claimed).test(text.value)) {
      return { field, reason: `'${text.value}' does not match its own claimed format '${claimed}'` };
    }
  }
  return undefined;
}

// baseLemmaCanonicalForm -- the one *_Form field every POS subtype
// shares via Word itself -- used to be a scalar field validated here
// (validateWordFormAttributes(), removed). It's a real WordForm now
// (WordForms.registerBaseLemmaForm(), data/word_forms.ts), so every
// POS subtype's own validate<Class>() already checks it: it's simply
// one of the entries `wordForms.formsOf(word)` returns, run through
// the exact same stringPatternsFor(field, pos) check every other
// WordForm gets -- WORD_FORM_MATRIX's own baseLemmaCanonicalForm row
// declares no String Pattern for any part of speech, so that check
// still reports an issue whenever a populated value's own `formats` is
// set to anything, with no separate function needed to say so.

