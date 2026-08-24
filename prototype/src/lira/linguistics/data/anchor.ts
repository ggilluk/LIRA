import type { LinguisticUnit } from "./linguistic_unit";

/** HTML5 <a>. The URL is structured reference data; visible anchor Text
 * creates LinguisticUnits. Keeping both preserves the source relationship
 * without treating the URL itself as language. */
export interface Anchor {
  url: string;
  title?: string;
  relationship?: string;
  linguisticUnits: readonly LinguisticUnit[];
}

export function createAnchor(init: Pick<Anchor, "url"> & Partial<Anchor>): Anchor {
  return { linguisticUnits: [], ...init };
}
