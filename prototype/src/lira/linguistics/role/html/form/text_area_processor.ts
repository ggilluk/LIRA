import type { TextArea } from "../../../data/html/form/text_area";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readTextArea(root: ParentNode): Element | undefined { return readElement(root, "textarea"); }
export function parseTextArea(element: Element): TextArea { return { name: attribute(element, "name"), linguisticUnits: textUnits(element) }; }
export function writeTextArea(value: TextArea): string {
  const name = value.name ? ` name="${escapeAttribute(value.name)}"` : "";
  return `<textarea${name}>${writeTextUnits(value.linguisticUnits)}</textarea>`;
}
