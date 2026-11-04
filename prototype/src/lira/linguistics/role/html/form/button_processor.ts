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
 * │ Module Name     │ lira/linguistics/role/html/form/button_processor
 * │ Filename        │ button_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Button (HTML5 <button>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/form/button_processor
 * @file button_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Button } from "../../../data/html/form/button";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <button> element from `root`. */
export function readButton(root: ParentNode): Element | undefined {
  return readElement(root, "button");
}
/** Parse <button> into LIRA Button. Text triggers LinguisticUnit ingestion. */
export function parseButton(element: Element): Button {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Button back to HTML5 <button>. */
export function writeButton(value: Button): string {
  return `<button>${writeTextUnits(value.linguisticUnits)}</button>`;
}
