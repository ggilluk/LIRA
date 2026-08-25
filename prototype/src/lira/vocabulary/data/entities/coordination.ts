import type { Identifier } from "../../../value_objects";
import type { Conjunction } from "./conjunction";

/**
 * Represents a headless coordination of two syntactically compatible
 * coordinates.
 *
 * A coordination contains two coordinates linked by a conjunction.
 * The conjunction is a marker of the coordination and is not its head.
 *
 * A coordinate may itself be a Coordination, permitting layered
 * coordination such as "A and B and C".
 *
 * Grammar reference:
 * Huddleston, Pullum & Reynolds,
 * A Student's Introduction to English Grammar,
 * Chapter 15: Coordinations.
 */
export interface Coordination<T> {

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

  left: T | Coordination<T>;
  conjunction: Conjunction;
  right: T | Coordination<T>;
}
