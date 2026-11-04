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
 * │ Module Name     │ lira/linguistics/role/html/text/block_quote_processor
 * │ Filename        │ block_quote_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes BlockQuote (HTML5 <blockquote>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/text/block_quote_processor
 * @file block_quote_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { BlockQuote } from "../../../data/html/text/block_quote";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readBlockQuote(root: ParentNode): Element | undefined { return readElement(root, "blockquote"); }
export function parseBlockQuote(element: Element): BlockQuote {
  return { linguisticUnits: textUnits(element), citeUrl: attribute(element, "cite") };
}
export function writeBlockQuote(value: BlockQuote): string {
  const cite = value.citeUrl ? ` cite="${escapeAttribute(value.citeUrl)}"` : "";
  return `<blockquote${cite}>${writeTextUnits(value.linguisticUnits)}</blockquote>`;
}
