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
 * │ Module Name     │ lira/linguistics/role/html/text/abbreviation_processor
 * │ Filename        │ abbreviation_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Abbreviation (HTML5 <abbr>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/text/abbreviation_processor
 * @file abbreviation_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Abbreviation } from "../../../data/html/text/abbreviation";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readAbbreviation(root: ParentNode): Element | undefined { return readElement(root, "abbr"); }
export function parseAbbreviation(element: Element): Abbreviation {
  const expansion = attribute(element, "title");
  return { linguisticUnits: textUnits(element), expansion: expansion ? { text: expansion } : undefined };
}
export function writeAbbreviation(value: Abbreviation): string {
  const title = value.expansion?.text ? ` title="${escapeAttribute(value.expansion.text)}"` : "";
  return `<abbr${title}>${writeTextUnits(value.linguisticUnits)}</abbr>`;
}
