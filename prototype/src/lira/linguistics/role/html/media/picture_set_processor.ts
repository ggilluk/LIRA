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
 * │ Module Name     │ lira/linguistics/role/html/media/picture_set_processor
 * │ Filename        │ picture_set_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes PictureSet (HTML5 <picture>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/media/picture_set_processor
 * @file picture_set_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { PictureSet } from "../../../data/html/media/picture_set";
import { attribute, escapeAttribute, readElement } from "../processor_support";
export function readPictureSet(root: ParentNode): Element | undefined { return readElement(root, "picture"); }
export function parsePictureSet(element: Element): PictureSet {
  return { sources: Array.from(element.querySelectorAll(":scope > source")).map((source) => attribute(source, "srcset") ?? "").filter(Boolean) };
}
export function writePictureSet(value: PictureSet): string {
  return `<picture>${value.sources.map((source) => `<source srcset="${escapeAttribute(source)}">`).join("")}</picture>`;
}
