import type { Time } from "../../../data/html/text/time";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readTime(root: ParentNode): Element | undefined { return readElement(root, "time"); }
export function parseTime(element: Element): Time {
  return { linguisticUnits: textUnits(element), dateTime: attribute(element, "datetime") };
}
export function writeTime(value: Time): string {
  const dateTime = value.dateTime ? ` datetime="${escapeAttribute(value.dateTime)}"` : "";
  return `<time${dateTime}>${writeTextUnits(value.linguisticUnits)}</time>`;
}
