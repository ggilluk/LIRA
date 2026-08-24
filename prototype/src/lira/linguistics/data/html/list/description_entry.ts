import type { LinguisticUnit } from "../../linguistic_unit";

/** One HTML5 <dt>/<dd> association. */
export interface DescriptionEntry {
  terms: readonly LinguisticUnit[];
  values: readonly LinguisticUnit[];
}
