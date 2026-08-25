import type { Adjective } from "./adjective";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between Adjectives.
 *
 * Example:
 * "red and blue"
 */
export interface AdjectiveCoordination extends Coordination<Adjective> {}
