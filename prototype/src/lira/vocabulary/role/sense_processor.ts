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
 * data/phrase.ts and data/dictionary.ts already import
 * createWord()/copyWordWithFreshUuid() from role/word_processor.ts. */

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
    uuid: init.uuid ?? { value: newUuid() },
    entryId: init.entryId ?? { value: newUuid() },
    ...init,
  };
}

/** A shallow copy of `sense`, sharing every field's own object identity
 * except `uuid`, which becomes a fresh Identifier -- copyWordForm/
 * copyWordWithFreshUuid's own exact counterpart (role/word_processor.ts),
 * used by Senses.seedFrom for the same reason: two Domains' independent
 * copies of the same sense must never be confused as the same graph
 * node. */
export function copySenseWithFreshUuid(sense: Sense): Sense {
  return { ...sense, uuid: { value: newUuid() } };
}
