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
  left: T | Coordination<T>;
  conjunction: Conjunction;
  right: T | Coordination<T>;
}
