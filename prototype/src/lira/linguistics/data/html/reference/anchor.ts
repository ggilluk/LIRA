import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <a>. */
export interface Anchor {
  url: string;
  title?: string;
  relationship?: string;
  linguisticUnits: readonly LinguisticUnit[];
}

export function createAnchor(init: Pick<Anchor, "url"> & Partial<Anchor>): Anchor {
  return { linguisticUnits: [], ...init };
}
