import type { UnorderedList } from "../../../data/html/list/unordered_list";
import { readElement } from "../processor_support";
import { parseListItem, writeListItem } from "./list_item_processor";
export function readUnorderedList(root: ParentNode): Element | undefined { return readElement(root, "ul"); }
export function parseUnorderedList(element: Element): UnorderedList {
  return { items: Array.from(element.children).filter((child) => child.tagName === "LI").map(parseListItem) };
}
export function writeUnorderedList(value: UnorderedList): string { return `<ul>${value.items.map(writeListItem).join("")}</ul>`; }
