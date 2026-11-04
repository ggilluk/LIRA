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
 * │ Module Name     │ lira/linguistics/role/html/table/table_section_processor
 * │ Filename        │ table_section_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes TableSection (HTML5 <thead>, <tbody>, or
 * │                 │ <tfoot>) for HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/table/table_section_processor
 * @file table_section_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
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
