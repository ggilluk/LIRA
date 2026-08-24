import type { DescriptionList } from "../../../data/html/list/description_list";
import { readElement } from "../processor_support";
import { parseDescriptionEntry, readDescriptionEntry, writeDescriptionEntry } from "./description_entry_processor";
export function readDescriptionList(root: ParentNode): Element | undefined { return readElement(root, "dl"); }
export function parseDescriptionList(element: Element): DescriptionList {
  return { entries: Array.from(element.children).filter((child) => child.tagName === "DT").map((term) => parseDescriptionEntry(readDescriptionEntry(term))) };
}
export function writeDescriptionList(value: DescriptionList): string { return `<dl>${value.entries.map(writeDescriptionEntry).join("")}</dl>`; }
