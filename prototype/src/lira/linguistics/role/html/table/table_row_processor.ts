import type { TableRow } from "../../../data/html/table/table_row";
import { readElement } from "../processor_support";
import { parseTableCell, writeTableCell } from "./table_cell_processor";
export function readTableRow(root: ParentNode): Element | undefined { return readElement(root, "tr"); }
export function parseTableRow(element: Element): TableRow {
  return { cells: Array.from(element.children).filter((child) => child.tagName === "TH" || child.tagName === "TD").map(parseTableCell) };
}
export function writeTableRow(value: TableRow): string { return `<tr>${value.cells.map(writeTableCell).join("")}</tr>`; }
