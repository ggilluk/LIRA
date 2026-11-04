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
 * │ Module Name     │ lira/linguistics/role/html/text/summary_processor
 * │ Filename        │ summary_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Summary (HTML5 <summary>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/text/summary_processor
 * @file summary_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Summary } from "../../../data/html/text/summary";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <summary> element from `root`. */
export function readSummary(root: ParentNode): Element | undefined {
  return readElement(root, "summary");
}
/** Parse <summary> into LIRA Summary. Text triggers LinguisticUnit ingestion. */
export function parseSummary(element: Element): Summary {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Summary back to HTML5 <summary>. */
export function writeSummary(value: Summary): string {
  return `<summary>${writeTextUnits(value.linguisticUnits)}</summary>`;
}
