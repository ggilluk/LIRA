import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <img>. */
export interface Picture {
  source: string;
  alternateText?: LinguisticUnit;
  width?: number;
  height?: number;
}
