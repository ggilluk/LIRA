import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <cite>. */
export interface Citation {
  linguisticUnits: readonly LinguisticUnit[];
  url?: string;
  identifier?: string;
}
