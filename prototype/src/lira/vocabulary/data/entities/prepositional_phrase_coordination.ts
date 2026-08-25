import type { PrepositionalPhrase } from "../prepositional_phrase";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between PrepositionalPhrases.
 *
 * Example:
 * "in London or in Paris"
 */
export interface PrepositionPhraseCoordination
  extends Coordination<PrepositionalPhrase> {}
