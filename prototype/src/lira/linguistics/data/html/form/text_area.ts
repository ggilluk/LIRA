import type { LinguisticUnit } from "../../linguistic_unit";

export interface TextArea {
  name?: string;
  linguisticUnits: readonly LinguisticUnit[];
}
