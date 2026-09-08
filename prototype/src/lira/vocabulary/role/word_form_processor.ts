/** The behaviour that operates on a bare WordForm
 * (data/entities/word_form.ts) -- construction and copying. WordForm's
 * own base-entity counterpart to role/word_processor.ts, kept as a
 * separate top-level role/ file rather than under role/processor/:
 * that folder holds each POS subtype's own processor (Noun, Verb, ...
 * -- all Word subtypes), and WordForm is a peer entity of Word, not
 * one of its subtypes.
 *
 * Known, approved exception to the usual data/-depends-on-role/-never
 * rule (data/entities/word.ts's own docstring; word_processor.ts's own
 * docstring for the precedent this follows): data/word_forms.ts's own
 * `WordForms` store calls createWordForm()/copyWordFormWithFreshUuid()
 * directly, so that data/ file ends up importing from here -- the same
 * reason data/entities/phrase.ts and data/dictionary.ts already import
 * createWord()/copyWordWithFreshUuid() from role/word_processor.ts. */

import { identifier } from "../../value_objects";
import type { WordForm } from "../data/entities/word_form";

// `formType`/`text` are the two facts every WordForm must be authored
// with -- WordInit's own exact "Pick the real requirements, Partial the
// rest" shape (role/word_processor.ts), not a bare `Partial<WordForm>`
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
 * node -- copySense/copyWordWithFreshUuid's own exact counterpart,
 * used by WordForms.seedFrom for the same reason: two Domains'
 * independent copies of the same form must never be confused as the
 * same graph node. */
export function copyWordFormWithFreshUuid(form: WordForm): WordForm {
  return { ...form, wordFormId: { ...form.wordFormId, uuid: crypto.randomUUID() } };
}

/** `form`'s own per-Domain graph identity -- `form.wordFormId.uuid`,
 * always set for a real WordForm (createWordForm()/
 * copyWordFormWithFreshUuid() above are its only two constructors, and
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
