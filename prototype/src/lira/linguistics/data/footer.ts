import type { LinguisticUnit } from "./linguistic_unit";

/** HTML5 <footer>. Preserves footer provenance separately from the
 * LinguisticUnits created for its Text values. */
export interface Footer {
  linguisticUnits: readonly LinguisticUnit[];
}

export function createFooter(init: Partial<Footer> = {}): Footer {
  return { linguisticUnits: [], ...init };
}
