import type { AdverbPhrase } from "../adverb_phrase";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between AdverbPhrases.
 *
 * Example:
 * "very quickly but quite carefully"
 */
export interface AdverbPhraseCoordination
  extends Coordination<AdverbPhrase> {}
