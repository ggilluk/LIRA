import type { TableSection } from "../../../data/html/table/table_section";
import { readElement } from "../processor_support";
import { parseTableRow, writeTableRow } from "./table_row_processor";
export function readTableSection(root: ParentNode): Element | undefined { return readElement(root, "thead, tbody, tfoot"); }
export function parseTableSection(element: Element): TableSection {
  return { rows: Array.from(element.children).filter((child) => child.tagName === "TR").map(parseTableRow) };
}
export function writeTableSection(value: TableSection, tag: "thead" | "tbody" | "tfoot" = "tbody"): string {
  return `<${tag}>${value.rows.map(writeTableRow).join("")}</${tag}>`;
}
