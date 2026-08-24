import type { TableCell } from "../../../data/html/table/table_cell";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readTableCell(root: ParentNode): Element | undefined { return readElement(root, "th, td"); }
export function parseTableCell(element: Element): TableCell {
  return { header: element.tagName === "TH", linguisticUnits: textUnits(element), columnSpan: Number(attribute(element, "colspan") ?? "1"), rowSpan: Number(attribute(element, "rowspan") ?? "1"), scope: attribute(element, "scope") as TableCell["scope"] };
}
export function writeTableCell(value: TableCell): string {
  const tag = value.header ? "th" : "td"; const attributes: string[] = [];
  if (value.columnSpan !== 1) attributes.push(`colspan="${value.columnSpan}"`);
  if (value.rowSpan !== 1) attributes.push(`rowspan="${value.rowSpan}"`);
  if (value.scope) attributes.push(`scope="${escapeAttribute(value.scope)}"`);
  return `<${tag}${attributes.length ? " " + attributes.join(" ") : ""}>${writeTextUnits(value.linguisticUnits)}</${tag}>`;
}
