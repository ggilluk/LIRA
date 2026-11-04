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
 * │ Module Name     │ lira/linguistics/role/html/list/description_list_processor
 * │ Filename        │ description_list_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes DescriptionList (HTML5 <dl>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/list/description_list_processor
 * @file description_list_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { DescriptionList } from "../../../data/html/list/description_list";
import { readElement } from "../processor_support";
import { parseDescriptionEntry, readDescriptionEntry, writeDescriptionEntry } from "./description_entry_processor";
export function readDescriptionList(root: ParentNode): Element | undefined { return readElement(root, "dl"); }
export function parseDescriptionList(element: Element): DescriptionList {
  return { entries: Array.from(element.children).filter((child) => child.tagName === "DT").map((term) => parseDescriptionEntry(readDescriptionEntry(term))) };
}
export function writeDescriptionList(value: DescriptionList): string { return `<dl>${value.entries.map(writeDescriptionEntry).join("")}</dl>`; }
