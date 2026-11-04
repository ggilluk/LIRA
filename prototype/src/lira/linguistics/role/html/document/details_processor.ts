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
 * │ Module Name     │ lira/linguistics/role/html/document/details_processor
 * │ Filename        │ details_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Details (HTML5 <details>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/document/details_processor
 * @file details_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Details } from "../../../data/html/document/details";
import { readElement, textUnits, writeTextUnits } from "../processor_support";
import { parseSummary, writeSummary } from "../text/summary_processor";
export function readDetails(root: ParentNode): Element | undefined { return readElement(root, "details"); }
export function parseDetails(element: Element): Details {
  const summary = element.querySelector(":scope > summary");
  return { summary: summary ? parseSummary(summary) : undefined, linguisticUnits: textUnits(element) };
}
export function writeDetails(value: Details): string {
  return `<details>${value.summary ? writeSummary(value.summary) : ""}${writeTextUnits(value.linguisticUnits)}</details>`;
}
