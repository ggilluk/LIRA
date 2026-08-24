import type { Anchor } from "../../../data/html/reference/anchor";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readAnchor(root: ParentNode): Element | undefined { return readElement(root, "a"); }
export function parseAnchor(element: Element): Anchor {
  return { url: attribute(element, "href") ?? "", relationship: attribute(element, "rel"), linguisticUnits: textUnits(element) };
}
export function writeAnchor(value: Anchor): string {
  const rel = value.relationship ? ` rel="${escapeAttribute(value.relationship)}"` : "";
  return `<a href="${escapeAttribute(value.url)}"${rel}>${writeTextUnits(value.linguisticUnits)}</a>`;
}
