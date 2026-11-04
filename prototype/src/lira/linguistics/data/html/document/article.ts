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
 * │ Module Name     │ lira/linguistics/data/html/document/article
 * │ Filename        │ article.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Article: LIRA's data model for the HTML5 <article> element.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/data/html/document/article
 * @file article.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Paragraph } from "../../paragraph";
import type { Figure } from "../media/figure";
import type { OrderedList } from "../list/ordered_list";
import type { UnorderedList } from "../list/unordered_list";
import type { Table } from "../table/table";
import type { Footer } from "./footer";
import type { Header } from "./header";
import type { Section } from "./section";

/** HTML5 <article>. */
export interface Article {
  header?: Header;
  paragraphs: readonly Paragraph[];
  sections: readonly Section[];
  figures: readonly Figure[];
  tables: readonly Table[];
  orderedLists: readonly OrderedList[];
  unorderedLists: readonly UnorderedList[];
  footer?: Footer;
}

export function createArticle(init: Partial<Article> = {}): Article {
  return { paragraphs: [], sections: [], figures: [], tables: [], orderedLists: [], unorderedLists: [], ...init };
}
