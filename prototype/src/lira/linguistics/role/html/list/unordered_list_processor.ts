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
 * │ Module Name     │ lira/linguistics/role/html/list/unordered_list_processor
 * │ Filename        │ unordered_list_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes UnorderedList (HTML5 <ul>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/list/unordered_list_processor
 * @file unordered_list_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { UnorderedList } from "../../../data/html/list/unordered_list";
import { readElement } from "../processor_support";
import { parseListItem, writeListItem } from "./list_item_processor";
export function readUnorderedList(root: ParentNode): Element | undefined { return readElement(root, "ul"); }
export function parseUnorderedList(element: Element): UnorderedList {
  return { items: Array.from(element.children).filter((child) => child.tagName === "LI").map(parseListItem) };
}
export function writeUnorderedList(value: UnorderedList): string { return `<ul>${value.items.map(writeListItem).join("")}</ul>`; }
