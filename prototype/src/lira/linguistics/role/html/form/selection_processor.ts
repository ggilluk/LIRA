import type { Selection } from "../../../data/html/form/selection";
import { readElement } from "../processor_support";
import { parseOption, writeOption } from "./option_processor";
export function readSelection(root: ParentNode): Element | undefined { return readElement(root, "select"); }
export function parseSelection(element: Element): Selection {
  return { options: Array.from(element.children).filter((child) => child.tagName === "OPTION").map(parseOption) };
}
export function writeSelection(value: Selection): string { return `<select>${value.options.map(writeOption).join("")}</select>`; }
