import type { NounPhrase } from "../noun_phrase";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between NounPhrases.
 *
 * Example:
 * "the car or the van"
 */
export interface NounPhraseCoordination
  extends Coordination<NounPhrase> {}
