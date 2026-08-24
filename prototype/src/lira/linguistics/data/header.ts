import type { LinguisticUnit } from "./linguistic_unit";

/** HTML5 <header>. Text values found within the header are retained as
 * LinguisticUnits while the Header preserves their document context. */
export interface Header {
  linguisticUnits: readonly LinguisticUnit[];
}

export function createHeader(init: Partial<Header> = {}): Header {
  return { linguisticUnits: [], ...init };
}
