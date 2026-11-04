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
 * │ Module Name     │ lira/linguistics/role/html/text/address_processor
 * │ Filename        │ address_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Address (HTML5 <address>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/text/address_processor
 * @file address_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Address } from "../../../data/html/text/address";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <address> element from `root`. */
export function readAddress(root: ParentNode): Element | undefined {
  return readElement(root, "address");
}
/** Parse <address> into LIRA Address. Text triggers LinguisticUnit ingestion. */
export function parseAddress(element: Element): Address {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Address back to HTML5 <address>. */
export function writeAddress(value: Address): string {
  return `<address>${writeTextUnits(value.linguisticUnits)}</address>`;
}
