import type { Noun } from "./noun";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between Nouns.
 *
 * Example:
 * "car or van"
 */
export interface NounCoordination extends Coordination<Noun> {}
