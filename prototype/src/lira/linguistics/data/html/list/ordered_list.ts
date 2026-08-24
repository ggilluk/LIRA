import type { ListItem } from "./list_item";

/** HTML5 <ol>. */
export interface OrderedList {
  items: readonly ListItem[];
  start?: number;
}

export function createOrderedList(init: Partial<OrderedList> = {}): OrderedList {
  return { items: [], ...init };
}
