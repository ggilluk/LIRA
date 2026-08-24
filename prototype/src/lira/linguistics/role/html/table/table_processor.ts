import type { Table } from "../../../data/html/table/table";
import { readElement } from "../processor_support";
import { parseTableCaption, writeTableCaption } from "./table_caption_processor";
import { parseTableSection, writeTableSection } from "./table_section_processor";
export function readTable(root: ParentNode): Element | undefined { return readElement(root, "table"); }
export function parseTable(element: Element): Table {
  const caption = element.querySelector(":scope > caption"); const head = element.querySelector(":scope > thead"); const footer = element.querySelector(":scope > tfoot");
  return { caption: caption ? parseTableCaption(caption) : undefined, head: head ? parseTableSection(head) : undefined, bodies: Array.from(element.querySelectorAll(":scope > tbody")).map(parseTableSection), footer: footer ? parseTableSection(footer) : undefined };
}
export function writeTable(value: Table): string {
  return `<table>${value.caption ? writeTableCaption(value.caption) : ""}${value.head ? writeTableSection(value.head, "thead") : ""}${value.bodies.map((body) => writeTableSection(body, "tbody")).join("")}${value.footer ? writeTableSection(value.footer, "tfoot") : ""}</table>`;
}
