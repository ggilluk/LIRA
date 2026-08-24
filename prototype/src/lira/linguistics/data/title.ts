import type { LinguisticUnit } from "./linguistic_unit";

/** HTML5 <title>. Its Text value is linguistic input and therefore
 * materialises as a LinguisticUnit. */
export interface Title extends LinguisticUnit {}

export function createTitle(init: Pick<Title, "text"> & Partial<Title>): Title {
  return { ...init };
}
