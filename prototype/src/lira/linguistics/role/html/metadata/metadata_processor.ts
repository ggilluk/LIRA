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
 * │ Module Name     │ lira/linguistics/role/html/metadata/metadata_processor
 * │ Filename        │ metadata_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Metadata (HTML5 <meta>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/metadata/metadata_processor
 * @file metadata_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Metadata } from "../../../data/html/metadata/metadata";
import { attribute, escapeAttribute, readElement } from "../processor_support";
export function readMetadata(root: ParentNode): Element | undefined { return readElement(root, "meta"); }
export function parseMetadata(element: Element): Metadata {
  return { name: attribute(element, "name"), property: attribute(element, "property"), content: attribute(element, "content") };
}
export function writeMetadata(value: Metadata): string {
  const attributes: string[] = [];
  if (value.name !== undefined) attributes.push(`name="${escapeAttribute(value.name)}"`);
  if (value.property !== undefined) attributes.push(`property="${escapeAttribute(value.property)}"`);
  if (value.content !== undefined) attributes.push(`content="${escapeAttribute(value.content)}"`);
  return `<meta${attributes.length ? " " + attributes.join(" ") : ""}>`;
}
