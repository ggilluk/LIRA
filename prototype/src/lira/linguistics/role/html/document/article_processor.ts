import type { Article } from "../../../data/html/document/article";
import { readElement } from "../processor_support";
import { parseFigure, writeFigure } from "../media/figure_processor";
import { parseOrderedList, writeOrderedList } from "../list/ordered_list_processor";
import { parseUnorderedList, writeUnorderedList } from "../list/unordered_list_processor";
import { parseTable, writeTable } from "../table/table_processor";
import { parseFooter, writeFooter } from "./footer_processor";
import { parseHeader, writeHeader } from "./header_processor";
import { parseSection, writeSection } from "./section_processor";
export function readArticle(root: ParentNode): Element | undefined { return readElement(root, "article"); }
export function parseArticle(element: Element): Article {
  const header = element.querySelector(":scope > header"); const footer = element.querySelector(":scope > footer");
  return {
    header: header ? parseHeader(header) : undefined,
    paragraphs: [],
    sections: Array.from(element.querySelectorAll(":scope > section")).map(parseSection),
    figures: Array.from(element.querySelectorAll(":scope > figure")).map(parseFigure),
    tables: Array.from(element.querySelectorAll(":scope > table")).map(parseTable),
    orderedLists: Array.from(element.querySelectorAll(":scope > ol")).map(parseOrderedList),
    unorderedLists: Array.from(element.querySelectorAll(":scope > ul")).map(parseUnorderedList),
    footer: footer ? parseFooter(footer) : undefined,
  };
}
export function writeArticle(value: Article): string {
  return `<article>${value.header ? writeHeader(value.header) : ""}${value.sections.map(writeSection).join("")}${value.figures.map(writeFigure).join("")}${value.tables.map(writeTable).join("")}${value.orderedLists.map(writeOrderedList).join("")}${value.unorderedLists.map(writeUnorderedList).join("")}${value.footer ? writeFooter(value.footer) : ""}</article>`;
}
