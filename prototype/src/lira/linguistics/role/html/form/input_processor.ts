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
 * │ Module Name     │ lira/linguistics/role/html/form/input_processor
 * │ Filename        │ input_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Input (HTML5 <input>) for HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/form/input_processor
 * @file input_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Input } from "../../../data/html/form/input";
import { attribute, escapeAttribute, readElement } from "../processor_support";
export function readInput(root: ParentNode): Element | undefined { return readElement(root, "input"); }
export function parseInput(element: Element): Input { return { type: attribute(element, "type") ?? "text", name: attribute(element, "name"), value: attribute(element, "value") }; }
export function writeInput(value: Input): string {
  const attributes = [`type="${escapeAttribute(value.type)}"`];
  if (value.name) attributes.push(`name="${escapeAttribute(value.name)}"`);
  if (value.value !== undefined) attributes.push(`value="${escapeAttribute(value.value)}"`);
  return `<input ${attributes.join(" ")}>`;
}
