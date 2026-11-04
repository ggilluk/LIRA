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
 * │ Module Name     │ lira/linguistics/role/html/document/aside_processor
 * │ Filename        │ aside_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Aside (HTML5 <aside>) for HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/document/aside_processor
 * @file aside_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Aside } from "../../../data/html/document/aside";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <aside> element from `root`. */
export function readAside(root: ParentNode): Element | undefined {
  return readElement(root, "aside");
}
/** Parse <aside> into LIRA Aside. Text triggers LinguisticUnit ingestion. */
export function parseAside(element: Element): Aside {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Aside back to HTML5 <aside>. */
export function writeAside(value: Aside): string {
  return `<aside>${writeTextUnits(value.linguisticUnits)}</aside>`;
}
