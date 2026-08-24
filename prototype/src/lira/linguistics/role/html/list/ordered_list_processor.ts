import type { OrderedList } from "../../../data/html/list/ordered_list";
import { attribute, escapeAttribute, readElement } from "../processor_support";
import { parseListItem, writeListItem } from "./list_item_processor";
export function readOrderedList(root: ParentNode): Element | undefined { return readElement(root, "ol"); }
export function parseOrderedList(element: Element): OrderedList {
  const start = attribute(element, "start");
  return { items: Array.from(element.children).filter((child) => child.tagName === "LI").map(parseListItem), start: start === undefined ? undefined : Number(start) };
}
export function writeOrderedList(value: OrderedList): string {
  const start = value.start === undefined ? "" : ` start="${escapeAttribute(String(value.start))}"`;
  return `<ol${start}>${value.items.map(writeListItem).join("")}</ol>`;
}
