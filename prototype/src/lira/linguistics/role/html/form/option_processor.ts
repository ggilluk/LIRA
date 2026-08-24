import type { Option } from "../../../data/html/form/option";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readOption(root: ParentNode): Element | undefined { return readElement(root, "option"); }
export function parseOption(element: Element): Option {
  return { value: attribute(element, "value"), selected: element.hasAttribute("selected"), linguisticUnits: textUnits(element) };
}
export function writeOption(value: Option): string {
  const attributes: string[] = [];
  if (value.value !== undefined) attributes.push(`value="${escapeAttribute(value.value)}"`);
  if (value.selected) attributes.push("selected");
  return `<option${attributes.length ? " " + attributes.join(" ") : ""}>${writeTextUnits(value.linguisticUnits)}</option>`;
}
