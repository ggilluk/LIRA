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
 * │ Module Name     │ lira/linguistics/role/html/reference/anchor_processor
 * │ Filename        │ anchor_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Anchor (HTML5 <a>) for HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/reference/anchor_processor
 * @file anchor_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Anchor } from "../../../data/html/reference/anchor";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readAnchor(root: ParentNode): Element | undefined { return readElement(root, "a"); }
export function parseAnchor(element: Element): Anchor {
  return { url: attribute(element, "href") ?? "", relationship: attribute(element, "rel"), linguisticUnits: textUnits(element) };
}
export function writeAnchor(value: Anchor): string {
  const rel = value.relationship ? ` rel="${escapeAttribute(value.relationship)}"` : "";
  return `<a href="${escapeAttribute(value.url)}"${rel}>${writeTextUnits(value.linguisticUnits)}</a>`;
}
