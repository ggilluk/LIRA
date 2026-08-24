import type { LinguisticUnit } from "../../linguistic_unit";
import type { Anchor } from "../reference/anchor";

/** HTML5 <nav>. */
export interface Navigation {
  linguisticUnits: readonly LinguisticUnit[];
  anchors: readonly Anchor[];
}

export function createNavigation(init: Partial<Navigation> = {}): Navigation {
  return { linguisticUnits: [], anchors: [], ...init };
}
