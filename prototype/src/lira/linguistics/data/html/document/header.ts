import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <header>. Any contained Text is represented by LinguisticUnit data. */
export interface Header {
  linguisticUnits: readonly LinguisticUnit[];
}

export function createHeader(init: Partial<Header> = {}): Header {
  return { linguisticUnits: [], ...init };
}
