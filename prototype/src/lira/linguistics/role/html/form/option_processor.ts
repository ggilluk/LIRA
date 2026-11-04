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
 * │ Module Name     │ lira/linguistics/role/html/form/option_processor
 * │ Filename        │ option_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Option (HTML5 <option>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/form/option_processor
 * @file option_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Option } from "../../../data/html/form/option";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readOption(root: ParentNode): Element | undefined { return readElement(root, "option"); }
export function parseOption(element: Element): Option {
  return { value: attribute(element, "value"), selected: element.hasAttribute("selected"), linguisticUnits: textUnits(element) };
}
export function writeOption(value: Option): string {
  const attributes: string[] = [];
  if (value.value !== undefined) attributes.push(`value="${escapeAttribute(value.value)}"`);
  if (value.selected) attributes.push("selected");
  return `<option${attributes.length ? " " + attributes.join(" ") : ""}>${writeTextUnits(value.linguisticUnits)}</option>`;
}
