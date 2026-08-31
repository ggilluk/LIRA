/** The behaviour that operates on a bare Sense (data/entities/sense.ts)
 * -- construction and copying. Sense's own base-entity counterpart to
 * role/word_processor.ts, kept as a top-level role/ file rather than
 * under role/processor/: that folder holds each POS subtype's own
 * processor (Noun, Verb, ... -- all Word subtypes), and Sense is not
 * one of them.
 *
 * Known, approved exception to the usual data/-depends-on-role/-never
 * rule (data/entities/word.ts's own docstring; word_processor.ts's own
 * docstring for the precedent this follows): data/senses.ts's own
 * `Senses` store calls copySenseWithFreshUuid() directly, so that
 * data/ file ends up importing from here -- the same reason
 * data/entities/phrase.ts and data/dictionary.ts already import
 * createWord()/copyWordWithFreshUuid() from role/word_processor.ts. */

import { identifier } from "../../value_objects";
import { newUuid } from "../data/uuid";
import type { Sense } from "../data/entities/sense";

export type SenseInit = Partial<Sense>;

export function createSense(init: SenseInit = {}): Sense {
  return {
    usageNotes: [],
    relatedDomainTags: [],
    sourceReferences: [],
    isCommon: false,
    isRootWord: false,
    // identifier()'s own auto-assigned `uuid` (value_objects/data/identifier.ts)
    // is this Sense's own per-Domain identity -- folded into `entryId`
    // itself now that Identifier carries a `uuid` of its own, no
    // reason for a second Identifier-typed field to exist alongside it
    // (WordForm's own identical fold, role/word_form_processor.ts).
    entryId: init.entryId ?? identifier(newUuid()),
    ...init,
  };
}

/** A shallow copy of `sense`, sharing every field's own object identity
 * except `entryId.uuid`, which becomes a fresh uuid -- `entryId.value`
 * (and every other field) stays the same, so this copy is still
 * recognisably the same underlying Sense, just a distinct graph node --
 * copyWordForm/copyWordWithFreshUuid's own exact counterpart
 * (role/word_processor.ts), used by Senses.seedFrom for the same
 * reason: two Domains' independent copies of the same sense must never
 * be confused as the same graph node. */
export function copySenseWithFreshUuid(sense: Sense): Sense {
  return { ...sense, entryId: { ...sense.entryId, uuid: newUuid() } };
}

/** `sense`'s own per-Domain graph identity -- `sense.entryId.uuid`,
 * always set for a real Sense (createSense()/copySenseWithFreshUuid()
 * above are its only two constructors, and both always assign it);
 * the assertion here just names that guarantee once instead of
 * repeating it at every call site that needs a Sense's own identity as
 * a plain string. `entryId.value` is the stable, cross-Domain identity
 * -- deliberately not what this reads (data/entities/sense.ts's own
 * docstring on the two roles `entryId` now plays). Word's own
 * identical graphUuid() (role/word_processor.ts). */
export function graphUuid(sense: Sense): string {
  return sense.entryId.uuid!;
}
