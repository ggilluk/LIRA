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
 * │ Module Name     │ lira/linguistics/role/html/document/main_processor
 * │ Filename        │ main_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Main (HTML5 <main>) for HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/document/main_processor
 * @file main_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
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
