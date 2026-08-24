import type { Anchor } from "./anchor";
import type { LinguisticUnit } from "./linguistic_unit";

/** HTML5 <nav>: navigation context. Its visible Text remains linguistic
 * input; anchors additionally preserve their destination URLs. */
export interface Navigation {
  linguisticUnits: readonly LinguisticUnit[];
  anchors: readonly Anchor[];
}

export function createNavigation(init: Partial<Navigation> = {}): Navigation {
  return { linguisticUnits: [], anchors: [], ...init };
}
