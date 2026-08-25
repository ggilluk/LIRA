import type { Word } from "./word";
import type { Coordination } from "./coordination";

/**
 * Represents coordination whose coordinates are Words.
 *
 * Example:
 * "car or van"
 */
export interface WordCoordination extends Coordination<Word> {}
