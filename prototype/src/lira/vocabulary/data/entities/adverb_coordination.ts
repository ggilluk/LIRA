import type { Adverb } from "./adverb";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between Adverbs.
 *
 * Example:
 * "quickly or carefully"
 */
export interface AdverbCoordination extends Coordination<Adverb> {}
