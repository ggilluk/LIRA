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
 * │ Module Name     │ lira/linguistics/data/html/document/section
 * │ Filename        │ section.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Section: LIRA's data model for the HTML5 <section> element.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/data/html/document/section
 * @file section.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Heading } from "../../heading";
import type { Paragraph } from "../../paragraph";
import type { OrderedList } from "../list/ordered_list";
import type { UnorderedList } from "../list/unordered_list";
import type { Figure } from "../media/figure";
import type { Table } from "../table/table";

/** HTML5 <section>. */
export interface Section {
  heading?: Heading;
  paragraphs: readonly Paragraph[];
  sections: readonly Section[];
  figures: readonly Figure[];
  tables: readonly Table[];
  orderedLists: readonly OrderedList[];
  unorderedLists: readonly UnorderedList[];
}

export function createSection(init: Partial<Section> = {}): Section {
  return { paragraphs: [], sections: [], figures: [], tables: [], orderedLists: [], unorderedLists: [], ...init };
}
