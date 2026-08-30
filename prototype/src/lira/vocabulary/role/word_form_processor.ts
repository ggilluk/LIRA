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
 * reason data/phrase.ts and data/dictionary.ts already import
 * createWord()/copyWordWithFreshUuid() from role/word_processor.ts. */

import { identifier } from "../../value_objects";
import { newUuid } from "../data/uuid";
import type { WordForm } from "../data/entities/word_form";

// `field`/`text` are the two facts every WordForm must be authored
// with -- WordInit's own exact "Pick the real requirements, Partial the
// rest" shape (role/word_processor.ts), not a bare `Partial<WordForm>`
// the way SenseInit is (every one of Sense's own fields is already
// optional, so Partial alone is enough there).
export type WordFormInit = Pick<WordForm, "field" | "text"> & Partial<Omit<WordForm, "field" | "text">>;

// WordForms.registerBaseLemmaForm()'s own `extra` parameter shape --
// every WordForm attribute that isn't required at creation time the way
// `field`/`text` are, applied onto an already-registered WordForm
// instead.
export type WordFormAttributes = Partial<
  Pick<
    WordForm,
    | "syllableRepresentation"
    | "syllableCount"
    | "stressPattern"
    | "frequencyValue"
    | "frequencyScale"
  >
>;

export function createWordForm(init: WordFormInit): WordForm {
  return {
    senseIds: [],
    contractionOf: [],
    // identifier()'s own auto-assigned `uuid` (value_objects/data/identifier.ts)
    // is this WordForm's own per-Domain identity -- Word/Sense's own
    // separate top-level `uuid` field, folded into `entryId` itself now
    // that Identifier carries a `uuid` of its own; no reason for a
    // second Identifier-typed field to exist alongside it.
    entryId: init.entryId ?? identifier(newUuid()),
    ...init,
  };
}

/** A shallow copy of `form`, sharing every field's own object identity
 * except `entryId.uuid`, which becomes a fresh uuid -- `entryId.value`
 * (and every other field) stays the same, so this copy is still
 * recognisably the same underlying WordForm, just a distinct graph
 * node -- copySense/copyWordWithFreshUuid's own exact counterpart,
 * used by WordForms.seedFrom for the same reason: two Domains'
 * independent copies of the same form must never be confused as the
 * same graph node. */
export function copyWordFormWithFreshUuid(form: WordForm): WordForm {
  return { ...form, entryId: { ...form.entryId, uuid: newUuid() } };
}

/** `form`'s own per-Domain graph identity -- `form.entryId.uuid`,
 * always set for a real WordForm (createWordForm()/
 * copyWordFormWithFreshUuid() above are its only two constructors, and
 * both always assign it); the assertion here just names that guarantee
 * once instead of repeating it at every call site that needs a
 * WordForm's own identity as a plain string (WordForms's own `byUuid`
 * map key, LexicalRelationship's own sourceWordFormId/targetWordFormId,
 * ...). `entryId.value` is the stable, cross-Domain identity --
 * deliberately not what this reads (data/entities/word_form.ts's own
 * docstring on the two roles `entryId` now plays). */
export function graphUuid(form: WordForm): string {
  return form.entryId.uuid!;
}
