/** The behaviour that operates on a bare Coordination
 * (data/entities/coordination.ts) -- construction and copying.
 * Coordination's own base-entity counterpart to role/processor/word_processor.ts,
 * kept as a top-level role/ file for now (role/domain_processor.ts's
 * own identical placement, for the same reason) -- unlike
 * role/processor/word_processor.ts/role/processor/sense_processor.ts/
 * role/processor/word_form_processor.ts, which moved under
 * role/processor/ alongside the Word POS subtype processors that
 * folder used to hold exclusively; this file wasn't part of that
 * move. */

import { identifier } from "../../value_objects";
import type { LinguisticUnit } from "../../linguistics/data/linguistic_unit";
import type { Coordination } from "../data/entities/coordination";

export type CoordinationInit<T extends LinguisticUnit> = Pick<Coordination<T>, "coordinates"> & Partial<Omit<Coordination<T>, "coordinates">>;

export function createCoordination<T extends LinguisticUnit>(init: CoordinationInit<T>): Coordination<T> {
  return {
    // identifier()'s own auto-assigned `uuid` (value_objects/data/identifier.ts)
    // is this Coordination's own per-Domain identity -- coordinationId's
    // own identical two-role shape every other entity in this folder
    // already has (Sense.senseId's own docstring on the fold this
    // mirrors).
    coordinationId: init.coordinationId ?? identifier(crypto.randomUUID()),
    ...init,
  };
}

/** A shallow copy of `coordination`, sharing every field's own object
 * identity except `coordinationId.uuid`, which becomes a fresh uuid --
 * copySenseWithFreshUuid/copyWordWithFreshUuid's own exact counterpart
 * (role/processor/sense_processor.ts, role/processor/word_processor.ts), used by
 * Coordinations.seedFrom for the same reason: two Domains' independent
 * copies of the same coordination must never be confused as the same
 * graph node. */
export function copyCoordinationWithFreshUuid<T extends LinguisticUnit>(coordination: Coordination<T>): Coordination<T> {
  return { ...coordination, coordinationId: { ...coordination.coordinationId, uuid: crypto.randomUUID() } };
}

/** `coordination`'s own per-Domain graph identity -- `coordinationId.uuid`,
 * always set for a real Coordination (createCoordination()/
 * copyCoordinationWithFreshUuid() above are its only two constructors,
 * and both always assign it). Sense/Word's own identical graphUuid()
 * (role/processor/sense_processor.ts, role/processor/word_processor.ts). */
export function graphUuid<T extends LinguisticUnit>(coordination: Coordination<T>): string {
  return coordination.coordinationId.uuid!;
}
