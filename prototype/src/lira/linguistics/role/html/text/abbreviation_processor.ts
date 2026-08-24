import type { Abbreviation } from "../../../data/html/text/abbreviation";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readAbbreviation(root: ParentNode): Element | undefined { return readElement(root, "abbr"); }
export function parseAbbreviation(element: Element): Abbreviation {
  const expansion = attribute(element, "title");
  return { linguisticUnits: textUnits(element), expansion: expansion ? { text: expansion } : undefined };
}
export function writeAbbreviation(value: Abbreviation): string {
  const title = value.expansion?.text ? ` title="${escapeAttribute(value.expansion.text)}"` : "";
  return `<abbr${title}>${writeTextUnits(value.linguisticUnits)}</abbr>`;
}
