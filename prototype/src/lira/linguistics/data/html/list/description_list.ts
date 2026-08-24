import type { DescriptionEntry } from "./description_entry";

/** HTML5 <dl>. */
export interface DescriptionList {
  entries: readonly DescriptionEntry[];
}

export function createDescriptionList(init: Partial<DescriptionList> = {}): DescriptionList {
  return { entries: [], ...init };
}
