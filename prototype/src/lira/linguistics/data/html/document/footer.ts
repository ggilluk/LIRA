import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <footer>. Any contained Text is represented by LinguisticUnit data. */
export interface Footer {
  linguisticUnits: readonly LinguisticUnit[];
}

export function createFooter(init: Partial<Footer> = {}): Footer {
  return { linguisticUnits: [], ...init };
}
