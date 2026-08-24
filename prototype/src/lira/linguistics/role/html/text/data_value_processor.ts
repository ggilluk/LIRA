import type { DataValue } from "../../../data/html/text/data_value";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readDataValue(root: ParentNode): Element | undefined { return readElement(root, "data"); }
export function parseDataValue(element: Element): DataValue {
  return { linguisticUnits: textUnits(element), value: attribute(element, "value") ?? "" };
}
export function writeDataValue(value: DataValue): string {
  return `<data value="${escapeAttribute(value.value)}">${writeTextUnits(value.linguisticUnits)}</data>`;
}
