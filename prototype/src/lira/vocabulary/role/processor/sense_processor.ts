/** The behaviour that operates on a bare Sense (data/entities/sense.ts)
 * -- construction and copying. Sense's own base-entity counterpart to
 * role/processor/word_processor.ts, and, like it, a member of
 * role/processor/ -- that folder now holds every entity's own
 * processor (each POS subtype's, plus Word/Sense/WordForm's own base-
 * or leaf-entity processors), not just the 11 POS subtypes' own.
 * Sense itself has no subtype family the way Word does, so this file's
 * scope stays the ordinary single-entity one -- construction/copy/
 * identity, nothing shared-across-a-family the way word_processor.ts's
 * spelling primitives are.
 *
 * Known, approved exception to the usual data/-depends-on-role/-never
 * rule (data/entities/word.ts's own docstring; word_processor.ts's own
 * docstring for the precedent this follows): data/senses.ts's own
 * `Senses` store calls createFreshUuidSenseCopy() directly, so that
 * data/ file ends up importing from here -- the same reason
 * data/entities/phrase.ts and data/dictionary.ts already import
 * createWord()/createFreshUuidWordCopy() from role/processor/word_processor.ts. */

import { identifier } from "../../../value_objects";
import type { Sense } from "../../data/entities/sense";

export type SenseInit = Partial<Sense>;

export function createSense(init: SenseInit = {}): Sense {
  return {
    usageNotes: [],
    relatedDomainTags: [],
    sourceReferences: [],
    isCommon: false,
    isRootWord: false,
    // identifier()'s own auto-assigned `uuid` (value_objects/data/identifier.ts)
    // is this Sense's own per-Domain identity -- folded into `senseId`
    // itself now that Identifier carries a `uuid` of its own, no
    // reason for a second Identifier-typed field to exist alongside it
    // (WordForm's own identical fold, role/processor/word_form_processor.ts).
    senseId: init.senseId ?? identifier(crypto.randomUUID()),
    ...init,
  };
}

/** A shallow copy of `sense`, sharing every field's own object identity
 * except `senseId.uuid`, which becomes a fresh uuid -- `senseId.value`
 * (and every other field) stays the same, so this copy is still
 * recognisably the same underlying Sense, just a distinct graph node --
 * copyWordForm/createFreshUuidWordCopy's own exact counterpart
 * (role/processor/word_processor.ts), used by Senses.seedFrom for the same
 * reason: two Domains' independent copies of the same sense must never
 * be confused as the same graph node. */
export function createFreshUuidSenseCopy(sense: Sense): Sense {
  return { ...sense, senseId: { ...sense.senseId, uuid: crypto.randomUUID() } };
}

/** `sense`'s own per-Domain graph identity -- `sense.senseId.uuid`,
 * always set for a real Sense (createSense()/createFreshUuidSenseCopy()
 * above are its only two constructors, and both always assign it);
 * the assertion here just names that guarantee once instead of
 * repeating it at every call site that needs a Sense's own identity as
 * a plain string. `senseId.value` is the stable, cross-Domain identity
 * -- deliberately not what this reads (data/entities/sense.ts's own
 * docstring on the two roles `senseId` now plays). Word's own
 * identical graphUuid() (role/processor/word_processor.ts). */
export function graphUuid(sense: Sense): string {
  return sense.senseId.uuid!;
}
