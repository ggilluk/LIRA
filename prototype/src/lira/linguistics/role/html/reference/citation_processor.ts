import type { Citation } from "../../../data/html/reference/citation";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readCitation(root: ParentNode): Element | undefined { return readElement(root, "cite"); }
export function parseCitation(element: Element): Citation {
  return { linguisticUnits: textUnits(element), url: attribute(element, "cite") ?? attribute(element, "href"), identifier: attribute(element, "id") };
}
export function writeCitation(value: Citation): string {
  const attributes: string[] = [];
  if (value.url) attributes.push(`cite="${escapeAttribute(value.url)}"`);
  if (value.identifier) attributes.push(`id="${escapeAttribute(value.identifier)}"`);
  return `<cite${attributes.length ? " " + attributes.join(" ") : ""}>${writeTextUnits(value.linguisticUnits)}</cite>`;
}
