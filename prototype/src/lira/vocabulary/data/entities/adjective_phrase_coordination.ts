import type { AdjectivePhrase } from "../adjective_phrase";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between AdjectivePhrases.
 *
 * Example:
 * "very old but extremely reliable"
 */
export interface AdjectivePhraseCoordination
  extends Coordination<AdjectivePhrase> {}
