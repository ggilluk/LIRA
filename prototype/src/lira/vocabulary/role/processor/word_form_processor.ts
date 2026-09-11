/** The behaviour that operates on a bare WordForm
 * (data/entities/word_form.ts) -- construction/copying, and Word Form
 * to Part of Speech Matrix validation. WordForm's own base-entity
 * counterpart to role/processor/word_processor.ts, and, like it, a
 * member of role/processor/ -- that folder holds every entity's own
 * processor now (each POS subtype's, plus Word/Sense/WordForm's own
 * base- or leaf-entity processors), not just the 11 POS subtypes'.
 * WordForm is a peer entity of Word, not one of its subtypes -- WordForm
 * has no subtype family of its own the way Word does, so this file
 * (unlike role/processor/word_processor.ts) never needs a "base class
 * for a subtype hierarchy" role, only the ordinary single-entity scope
 * every other leaf entity's own role/<entity>_processor.ts already has
 * (role/processor/sense_processor.ts, role/coordination_processor.ts,
 * role/domain_processor.ts -- these last two remain top-level role/
 * files, not yet moved here).
 *
 * `WordFormIssue`/`createFormatPatternRegExp()`/`recogniseFormTextIssue()` moved
 * here from role/processor/word_processor.ts, which held them only because every
 * POS subtype's own processor already imported `createWord` from that
 * file, so borrowing it for Matrix validation too "added no new
 * cross-file dependency" (that file's own former docstring, verbatim)
 * -- proximity to a one-time import, not a genuine Word-entity concern.
 * Every real call site validates one WordForm's own `formType`/`text`
 * (e.g. `recogniseFormTextIssue(form.formType, form.text, stringPatternsFor(...))`
 * in each POS processor's own `validate<Class>()`), so this is WordForm's
 * own behaviour, not Word's -- unlike the regular-English-suffix
 * spelling primitives (role/processor/word_processor.ts's own docstring), which
 * stayed on `Word`'s side because they're reused *across* the POS
 * subtype family, the base-class role only `word_processor.ts` plays.
 *
 * Known, approved exception to the usual data/-depends-on-role/-never
 * rule (data/entities/word.ts's own docstring; word_processor.ts's own
 * docstring for the precedent this follows): data/word_forms.ts's own
 * `WordForms` store calls createWordForm()/createFreshUuidWordFormCopy()
 * directly, so that data/ file ends up importing from here -- the same
 * reason data/entities/phrase.ts and data/dictionary.ts already import
 * createWord()/createFreshUuidWordCopy() from role/processor/word_processor.ts. */

import { identifier, type Text } from "../../../value_objects";
import type { WordForm } from "../../data/entities/word_form";
import { wordFormTypeLabel, type WordFormType } from "../../data/enums/word_forms_enum";

// `formType`/`text` are the two facts every WordForm must be authored
// with -- WordInit's own exact "Pick the real requirements, Partial the
// rest" shape (role/processor/word_processor.ts), not a bare `Partial<WordForm>`
// the way SenseInit is (every one of Sense's own fields is already
// optional, so Partial alone is enough there).
export type WordFormInit = Pick<WordForm, "formType" | "text"> & Partial<Omit<WordForm, "formType" | "text">>;

// WordForms.registerBaseLemmaForm()'s own `extra` parameter shape --
// every WordForm attribute that isn't required at creation time the way
// `formType`/`text` are, applied onto an already-registered WordForm
// instead.
export type WordFormAttributes = Partial<Pick<WordForm, "frequencyValue" | "frequencyScale">>;

export function createWordForm(init: WordFormInit): WordForm {
  return {
    senseIds: [],
    contractionOf: [],
    // identifier()'s own auto-assigned `uuid` (value_objects/data/identifier.ts)
    // is this WordForm's own per-Domain identity -- Word/Sense's own
    // separate top-level `uuid` field, folded into `wordFormId` itself now
    // that Identifier carries a `uuid` of its own; no reason for a
    // second Identifier-typed field to exist alongside it.
    wordFormId: init.wordFormId ?? identifier(crypto.randomUUID()),
    ...init,
  };
}

/** A shallow copy of `form`, sharing every field's own object identity
 * except `wordFormId.uuid`, which becomes a fresh uuid -- `wordFormId.value`
 * (and every other field) stays the same, so this copy is still
 * recognisably the same underlying WordForm, just a distinct graph
 * node -- copySense/createFreshUuidWordCopy's own exact counterpart,
 * used by WordForms.seedFrom for the same reason: two Domains'
 * independent copies of the same form must never be confused as the
 * same graph node. */
export function createFreshUuidWordFormCopy(form: WordForm): WordForm {
  return { ...form, wordFormId: { ...form.wordFormId, uuid: crypto.randomUUID() } };
}

/** `form`'s own per-Domain graph identity -- `form.wordFormId.uuid`,
 * always set for a real WordForm (createWordForm()/
 * createFreshUuidWordFormCopy() above are its only two constructors, and
 * both always assign it); the assertion here just names that guarantee
 * once instead of repeating it at every call site that needs a
 * WordForm's own identity as a plain string (WordForms's own `byUuid`
 * map key, LexicalRelationship's own sourceWordFormId/targetWordFormId,
 * ...). `wordFormId.value` is the stable, cross-Domain identity --
 * deliberately not what this reads (data/entities/word_form.ts's own
 * docstring on the two roles `wordFormId` now plays). */
export function graphUuid(form: WordForm): string {
  return form.wordFormId.uuid!;
}

// -- Word Form to Part of Speech Matrix attribute validation (data/matrices/word_form_part_of_speech_matrix.md) --
// Each POS subtype (noun.ts, verb.ts, ...) owns its own row of the
// matrix's String Pattern column and its own validate<Class>() -- there
// is deliberately no single file holding every class's patterns. What's
// shared here is only the generic mechanism every one of those
// validate<Class>() functions reuses: parsing a `Text.formats` entry
// into a real RegExp, and checking one field's Text against one known
// pattern set.

/** One validation failure from recogniseFormTextIssue/validate<Class> below --
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
 * *pattern* (recogniseFormTextIssue's own concern) is. */
export function createFormatPatternRegExp(pattern: string): RegExp {
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
export function recogniseFormTextIssue(field: WordFormType, text: Text, known: readonly string[]): WordFormIssue | undefined {
  if (text.formats === undefined) return undefined;
  for (const claimed of text.formats) {
    if (!known.includes(claimed)) {
      return {
        field,
        reason: `'${claimed}' is not a recognised String Pattern for '${wordFormTypeLabel(field)}' (word_form_part_of_speech_matrix.md)`,
      };
    }
    if (!createFormatPatternRegExp(claimed).test(text.value)) {
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
