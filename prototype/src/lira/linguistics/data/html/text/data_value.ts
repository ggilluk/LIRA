import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <data>. */
export interface DataValue {
  linguisticUnits: readonly LinguisticUnit[];
  value: string;
}
