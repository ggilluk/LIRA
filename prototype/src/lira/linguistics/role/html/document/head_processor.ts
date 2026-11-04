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
 * │ Module Name     │ lira/linguistics/role/html/document/head_processor
 * │ Filename        │ head_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Head (HTML5 <head>) for HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/document/head_processor
 * @file head_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Head } from "../../../data/html/document/head";
import { readElement } from "../processor_support";
import { parseMetadata, writeMetadata } from "../metadata/metadata_processor";
import { parseTitle, writeTitle } from "../metadata/title_processor";
import { parseLink, writeLink } from "../reference/link_processor";
export function readHead(root: ParentNode): Element | undefined { return readElement(root, "head"); }
export function parseHead(element: Element): Head {
  const title = element.querySelector(":scope > title");
  return { title: title ? parseTitle(title) : undefined, metadata: Array.from(element.querySelectorAll(":scope > meta")).map(parseMetadata), links: Array.from(element.querySelectorAll(":scope > link")).map(parseLink) };
}
export function writeHead(value: Head): string {
  return `<head>${value.title ? writeTitle(value.title) : ""}${value.metadata.map(writeMetadata).join("")}${value.links.map(writeLink).join("")}</head>`;
}
