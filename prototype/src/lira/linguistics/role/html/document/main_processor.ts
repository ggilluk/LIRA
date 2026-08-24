import type { Main } from "../../../data/html/document/main";
import { readElement } from "../processor_support";
import { parseArticle, writeArticle } from "./article_processor";
import { parseSection, writeSection } from "./section_processor";
export function readMain(root: ParentNode): Element | undefined { return readElement(root, "main"); }
export function parseMain(element: Element): Main {
  return { articles: Array.from(element.querySelectorAll(":scope > article")).map(parseArticle), sections: Array.from(element.querySelectorAll(":scope > section")).map(parseSection) };
}
export function writeMain(value: Main): string {
  return `<main>${value.articles.map(writeArticle).join("")}${value.sections.map(writeSection).join("")}</main>`;
}
