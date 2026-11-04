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
 * │ Module Name     │ lira/linguistics/role/html/document/header_processor
 * │ Filename        │ header_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Header (HTML5 <header>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/document/header_processor
 * @file header_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Header } from "../../../data/html/document/header";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <header> element from `root`. */
export function readHeader(root: ParentNode): Element | undefined {
  return readElement(root, "header");
}
/** Parse <header> into LIRA Header. Text triggers LinguisticUnit ingestion. */
export function parseHeader(element: Element): Header {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Header back to HTML5 <header>. */
export function writeHeader(value: Header): string {
  return `<header>${writeTextUnits(value.linguisticUnits)}</header>`;
}
