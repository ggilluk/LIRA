import type { Verb } from "./verb";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between Verbs.
 *
 * Example:
 * "run or walk"
 */
export interface VerbCoordination extends Coordination<Verb> {}
