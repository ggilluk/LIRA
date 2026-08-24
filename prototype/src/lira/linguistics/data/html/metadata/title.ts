import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <title>. */
export interface Title extends LinguisticUnit {}

export function createTitle(init: Pick<Title, "text"> & Partial<Title>): Title {
  return { ...init };
}
