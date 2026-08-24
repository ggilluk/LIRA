import type { LinguisticUnit } from "../../linguistic_unit";

export interface Label {
  forIdentifier?: string;
  linguisticUnits: readonly LinguisticUnit[];
}
