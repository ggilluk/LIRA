import type { ListItem } from "./list_item";

/** HTML5 <ul>. */
export interface UnorderedList {
  items: readonly ListItem[];
}

export function createUnorderedList(init: Partial<UnorderedList> = {}): UnorderedList {
  return { items: [], ...init };
}
