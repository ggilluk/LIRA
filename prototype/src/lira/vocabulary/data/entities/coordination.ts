import type { Identifier } from "../../../value_objects";
import type { LinguisticUnit } from "../../../linguistics/data/linguistic_unit";

/**
 * Represents a headless coordination of two or more syntactically
 * compatible coordinates.
 *
 * A coordinate may itself be a Coordination, permitting layered
 * coordination such as "A and B and C".
 *
 * Grammar reference:
 * Huddleston, Pullum & Reynolds,
 * A Student's Introduction to English Grammar,
 * Chapter 15: Coordinations.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape, including why `coordinates`
 * replaced the earlier binary `left`/`right` pair.
 */
export interface Coordination<T extends LinguisticUnit> {

  // ── Identity ─────────────────────────────────────────────

  /**
   * Identifier of the underlying coordination this record represents --
   * Word/Phrase's own `entryId` shape (see either one's own docstring),
   * mirrored here so a Coordination can be addressed, copied across
   * Domains, and (once a store exists for it) looked up the same way
   * every other entity in this folder already is.
   *
   * `entryId.value` is stable across every Domain that holds a copy of
   * this Coordination; `entryId.uuid` is this Coordination's own unique
   * identifier within its own Domain, freshly regenerated every time
   * this Coordination is copied into another Domain.
   */
  entryId: Identifier;


  // ── Structure ────────────────────────────────────────────

  /**
   * This Coordination's own coordinated constituents, in order -- each
   * either a bare `T` or a nested `Coordination<T>` (layered
   * coordination, this interface's own docstring above). Always two or
   * more -- a single coordinate isn't a coordination at all -- but not
   * enforced at the type level: no runtime or TypeScript validation
   * mechanism exists for this today (the same "documented ahead of
   * enforcement" status data/entities/noun_phrase.ts's own ModifierRole
   * note already has).
   *
   * A flat array, not the earlier binary `left`/`right` pair, so a
   * comma-then-conjunction list ("red, white, and blue") represents
   * directly as one three-element `coordinates` array with a single
   * `coordinator` naming "and" -- the earlier binary shape had no
   * honest value to put in an inner coordination's own conjunction slot
   * for the comma joins, since no real Conjunction Word stands in for a
   * comma.
   */
  coordinates: readonly (T | Coordination<T>)[];

  /**
   * The coordinating conjunction marking this Coordination -- a graph-
   * reference pointer to the one WordForm (data/entities/word_form.ts)
   * whose own resolved Word is a Conjunction
   * (data/entities/conjunction.ts) with `conjunctionType:
   * ConjunctionType.COORDINATING` (data/enums/conjunction_type.ts),
   * resolved against a WordForms store (`WordForms.findByUuid()`), not
   * an embedded Word/Conjunction copy -- Phrase.headWord's own
   * identical by-reference pattern (data/entities/phrase.ts). An
   * `Identifier` carries no type of its own to narrow, so this is never
   * typed any more specifically than that -- the same reasoning
   * data/entities/noun_phrase.ts's own `headWord` docstring already
   * gives for its identical shape.
   *
   * Undefined for an asyndetic coordination -- no conjunction present
   * at all, e.g. every join in a listed enumeration but the last
   * ("red, white, blue" with no "and"). The conjunction is a marker of
   * the coordination, never its head, so its absence doesn't affect
   * whether `coordinates` resolves.
   */
  coordinator?: Identifier;
}
