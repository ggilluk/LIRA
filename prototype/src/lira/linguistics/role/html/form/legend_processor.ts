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
 * │ Module Name     │ lira/linguistics/role/html/form/legend_processor
 * │ Filename        │ legend_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Legend (HTML5 <legend>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/form/legend_processor
 * @file legend_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Legend } from "../../../data/html/form/legend";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <legend> element from `root`. */
export function readLegend(root: ParentNode): Element | undefined {
  return readElement(root, "legend");
}
/** Parse <legend> into LIRA Legend. Text triggers LinguisticUnit ingestion. */
export function parseLegend(element: Element): Legend {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Legend back to HTML5 <legend>. */
export function writeLegend(value: Legend): string {
  return `<legend>${writeTextUnits(value.linguisticUnits)}</legend>`;
}
