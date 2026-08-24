import type { LinguisticUnit } from "../../linguistic_unit";
import type { Summary } from "../text/summary";

/** HTML5 <details>. */
export interface Details {
  summary?: Summary;
  linguisticUnits: readonly LinguisticUnit[];
}
