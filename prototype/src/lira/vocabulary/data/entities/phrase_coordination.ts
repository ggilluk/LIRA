import type { Phrase } from "../phrase";
import type { Coordination } from "./coordination";

/**
 * Represents coordination whose coordinates are Phrases.
 *
 * Coordinates need not have identical phrase categories where they
 * can perform the same syntactic function.
 *
 * Coordination remains headless and therefore does not introduce
 * another PhraseType.
 */
export interface PhraseCoordination extends Coordination<Phrase> {}
