/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/linguistics/role/html/table/table_cell_processor
 * │ Filename        │ table_cell_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes TableCell (HTML5 <th> or <td>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/table/table_cell_processor
 * @file table_cell_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
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
