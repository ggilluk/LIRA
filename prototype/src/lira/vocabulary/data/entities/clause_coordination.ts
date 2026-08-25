import type { Clause } from "../../../linguistics/data/clause";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between Clauses.
 *
 * Example:
 * "John arrived and Mary left"
 */
export interface ClauseCoordination
  extends Coordination<Clause> {}
