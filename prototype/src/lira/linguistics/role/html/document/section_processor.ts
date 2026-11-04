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
 * │ Module Name     │ lira/linguistics/role/html/document/section_processor
 * │ Filename        │ section_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Section (HTML5 <section>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/document/section_processor
 * @file section_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Section } from "../../../data/html/document/section";
import { readElement } from "../processor_support";
import { parseFigure, writeFigure } from "../media/figure_processor";
import { parseOrderedList, writeOrderedList } from "../list/ordered_list_processor";
import { parseUnorderedList, writeUnorderedList } from "../list/unordered_list_processor";
import { parseTable, writeTable } from "../table/table_processor";
export function readSection(root: ParentNode): Element | undefined { return readElement(root, "section"); }
export function parseSection(element: Element): Section {
  return {
    paragraphs: [],
    sections: Array.from(element.querySelectorAll(":scope > section")).map(parseSection),
    figures: Array.from(element.querySelectorAll(":scope > figure")).map(parseFigure),
    tables: Array.from(element.querySelectorAll(":scope > table")).map(parseTable),
    orderedLists: Array.from(element.querySelectorAll(":scope > ol")).map(parseOrderedList),
    unorderedLists: Array.from(element.querySelectorAll(":scope > ul")).map(parseUnorderedList),
  };
}
export function writeSection(value: Section): string {
  return `<section>${value.sections.map(writeSection).join("")}${value.figures.map(writeFigure).join("")}${value.tables.map(writeTable).join("")}${value.orderedLists.map(writeOrderedList).join("")}${value.unorderedLists.map(writeUnorderedList).join("")}</section>`;
}
