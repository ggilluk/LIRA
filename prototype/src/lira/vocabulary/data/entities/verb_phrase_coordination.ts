import type { VerbPhrase } from "../verb_phrase";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between VerbPhrases.
 *
 * Example:
 * "washed the car and cleaned the windows"
 */
export interface VerbPhraseCoordination
  extends Coordination<VerbPhrase> {}
