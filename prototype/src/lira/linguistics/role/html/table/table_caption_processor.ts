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
 * │ Module Name     │ lira/linguistics/role/html/table/table_caption_processor
 * │ Filename        │ table_caption_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes TableCaption (HTML5 <caption>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/table/table_caption_processor
 * @file table_caption_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { TableCaption } from "../../../data/html/table/table_caption";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <caption> element from `root`. */
export function readTableCaption(root: ParentNode): Element | undefined {
  return readElement(root, "caption");
}
/** Parse <caption> into LIRA TableCaption. Text triggers LinguisticUnit ingestion. */
export function parseTableCaption(element: Element): TableCaption {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA TableCaption back to HTML5 <caption>. */
export function writeTableCaption(value: TableCaption): string {
  return `<caption>${writeTextUnits(value.linguisticUnits)}</caption>`;
}
