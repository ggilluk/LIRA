import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <time>. */
export interface Time {
  linguisticUnits: readonly LinguisticUnit[];
  dateTime?: string;
}
