import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <summary>. */
export interface Summary {
  linguisticUnits: readonly LinguisticUnit[];
}
