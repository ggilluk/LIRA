import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <aside>. */
export interface Aside {
  linguisticUnits: readonly LinguisticUnit[];
}

export function createAside(init: Partial<Aside> = {}): Aside {
  return { linguisticUnits: [], ...init };
}
