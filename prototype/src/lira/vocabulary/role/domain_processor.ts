/** The behaviour that operates on a bare Domain (data/entities/domain.ts)
 * -- construction and copying. Domain's own base-entity counterpart to
 * role/processor/word_processor.ts, kept as a top-level role/ file for
 * now, unlike role/processor/word_processor.ts/role/processor/sense_processor.ts/
 * role/processor/word_form_processor.ts, which moved under role/processor/
 * alongside the Word POS subtype processors that folder used to hold
 * exclusively -- this file and role/coordination_processor.ts weren't
 * part of that move and remain top-level role/ files. */

import { identifier } from "../../value_objects";
import type { Domain } from "../data/entities/domain";

export type DomainInit = Pick<Domain, "domainText"> & Partial<Omit<Domain, "domainText">>;

export function createDomain(init: DomainInit): Domain {
  return {
    // identifier()'s own auto-assigned `uuid` (value_objects/data/identifier.ts)
    // is this Domain's own per-knowledge-Domain identity -- folded into
    // `domainId` itself, the same fold every other entity in this
    // folder already gives its own identity field
    // (data/entities/word.ts's own docstring on the precedent).
    domainId: init.domainId ?? identifier(crypto.randomUUID()),
    ...init,
  };
}

/** A shallow copy of `domain`, sharing every field's own object identity
 * except `domainId.uuid`, which becomes a fresh uuid -- `domainId.value`
 * (and every other field) stays the same, so this copy is still
 * recognisably the same underlying Domain, just a distinct graph node.
 * createFreshUuidSenseCopy/createFreshUuidWordCopy's own exact counterpart
 * (role/processor/sense_processor.ts, role/processor/word_processor.ts), used by
 * Domains.seedFrom for the same reason: two knowledge-Domains'
 * independent copies of the same topic-domain tag must never be
 * confused as the same graph node. */
export function createFreshUuidDomainCopy(domain: Domain): Domain {
  return { ...domain, domainId: { ...domain.domainId, uuid: crypto.randomUUID() } };
}

/** `domain`'s own per-knowledge-Domain graph identity -- `domainId.uuid`,
 * always set for a real Domain (createDomain()/createFreshUuidDomainCopy()
 * above are its only two constructors, and both always assign it).
 * Word/Sense/Coordination's own identical graphUuid()
 * (role/processor/word_processor.ts, role/processor/sense_processor.ts,
 * role/coordination_processor.ts). */
export function graphUuid(domain: Domain): string {
  return domain.domainId.uuid!;
}
