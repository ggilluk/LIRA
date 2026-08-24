import type { LinguisticUnit } from "../../linguistic_unit";

export interface Option {
  value?: string;
  selected: boolean;
  linguisticUnits: readonly LinguisticUnit[];
}
