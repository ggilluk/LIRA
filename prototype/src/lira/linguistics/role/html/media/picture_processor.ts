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
 * │ Module Name     │ lira/linguistics/role/html/media/picture_processor
 * │ Filename        │ picture_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Picture (HTML5 <img>) for HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/media/picture_processor
 * @file picture_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Picture } from "../../../data/html/media/picture";
import { attribute, escapeAttribute, readElement } from "../processor_support";
export function readPicture(root: ParentNode): Element | undefined { return readElement(root, "img"); }
export function parsePicture(element: Element): Picture {
  const alt = attribute(element, "alt"); const width = attribute(element, "width"); const height = attribute(element, "height");
  return { source: attribute(element, "src") ?? "", alternateText: alt ? { text: alt } : undefined, width: width ? Number(width) : undefined, height: height ? Number(height) : undefined };
}
export function writePicture(value: Picture): string {
  const attributes = [`src="${escapeAttribute(value.source)}"`];
  if (value.alternateText?.text) attributes.push(`alt="${escapeAttribute(value.alternateText.text)}"`);
  if (value.width !== undefined) attributes.push(`width="${value.width}"`);
  if (value.height !== undefined) attributes.push(`height="${value.height}"`);
  return `<img ${attributes.join(" ")}>`;
}
