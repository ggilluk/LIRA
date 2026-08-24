import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <abbr>. */
export interface Abbreviation {
  linguisticUnits: readonly LinguisticUnit[];
  expansion?: LinguisticUnit;
}
