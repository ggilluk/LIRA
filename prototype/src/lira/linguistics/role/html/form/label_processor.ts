import type { Label } from "../../../data/html/form/label";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readLabel(root: ParentNode): Element | undefined { return readElement(root, "label"); }
export function parseLabel(element: Element): Label { return { forIdentifier: attribute(element, "for"), linguisticUnits: textUnits(element) }; }
export function writeLabel(value: Label): string {
  const target = value.forIdentifier ? ` for="${escapeAttribute(value.forIdentifier)}"` : "";
  return `<label${target}>${writeTextUnits(value.linguisticUnits)}</label>`;
}
