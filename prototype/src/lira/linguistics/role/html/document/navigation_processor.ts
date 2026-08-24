import type { Navigation } from "../../../data/html/document/navigation";
import { readElement } from "../processor_support";
import { parseAnchor, writeAnchor } from "../reference/anchor_processor";
export function readNavigation(root: ParentNode): Element | undefined { return readElement(root, "nav"); }
export function parseNavigation(element: Element): Navigation {
  return { anchors: Array.from(element.querySelectorAll(":scope a")).map(parseAnchor) };
}
export function writeNavigation(value: Navigation): string { return `<nav>${value.anchors.map(writeAnchor).join("")}</nav>`; }
