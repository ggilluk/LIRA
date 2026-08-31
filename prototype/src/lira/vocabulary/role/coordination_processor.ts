/** The behaviour that operates on a bare Coordination
 * (data/entities/coordination.ts) -- construction and copying.
 * Coordination's own base-entity counterpart to role/word_processor.ts,
 * kept as a top-level role/ file rather than under role/processor/:
 * that folder holds each POS subtype's own processor (Noun, Verb, ...
 * -- all Word subtypes), and Coordination is not one of them (Sense's
 * own identical placement, role/sense_processor.ts, for the same
 * reason). */

import { identifier } from "../../value_objects";
import { newUuid } from "../data/uuid";
import type { LinguisticUnit } from "../../linguistics/data/linguistic_unit";
import type { Coordination } from "../data/entities/coordination";

export type CoordinationInit<T extends LinguisticUnit> = Pick<Coordination<T>, "coordinates"> & Partial<Omit<Coordination<T>, "coordinates">>;

export function createCoordination<T extends LinguisticUnit>(init: CoordinationInit<T>): Coordination<T> {
  return {
    // identifier()'s own auto-assigned `uuid` (value_objects/data/identifier.ts)
    // is this Coordination's own per-Domain identity -- entryId's own
    // identical two-role shape every other entity in this folder
    // already has (Sense.entryId's own docstring on the fold this
    // mirrors).
    entryId: init.entryId ?? identifier(newUuid()),
    ...init,
  };
}

/** A shallow copy of `coordination`, sharing every field's own object
 * identity except `entryId.uuid`, which becomes a fresh uuid --
 * copySenseWithFreshUuid/copyWordWithFreshUuid's own exact counterpart
 * (role/sense_processor.ts, role/word_processor.ts), used by
 * Coordinations.seedFrom for the same reason: two Domains' independent
 * copies of the same coordination must never be confused as the same
 * graph node. */
export function copyCoordinationWithFreshUuid<T extends LinguisticUnit>(coordination: Coordination<T>): Coordination<T> {
  return { ...coordination, entryId: { ...coordination.entryId, uuid: newUuid() } };
}

/** `coordination`'s own per-Domain graph identity -- `entryId.uuid`,
 * always set for a real Coordination (createCoordination()/
 * copyCoordinationWithFreshUuid() above are its only two constructors,
 * and both always assign it). Sense/Word's own identical graphUuid()
 * (role/sense_processor.ts, role/word_processor.ts). */
export function graphUuid<T extends LinguisticUnit>(coordination: Coordination<T>): string {
  return coordination.entryId.uuid!;
}
