import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <li>. */
export interface ListItem {
  linguisticUnits: readonly LinguisticUnit[];
}

export function createListItem(init: Partial<ListItem> = {}): ListItem {
  return { linguisticUnits: [], ...init };
}
