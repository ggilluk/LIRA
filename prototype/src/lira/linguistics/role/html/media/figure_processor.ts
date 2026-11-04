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
 * │ Module Name     │ lira/linguistics/role/html/media/figure_processor
 * │ Filename        │ figure_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Figure (HTML5 <figure>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/media/figure_processor
 * @file figure_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Figure } from "../../../data/html/media/figure";
import { readElement } from "../processor_support";
import { parseFigureCaption, writeFigureCaption } from "./figure_caption_processor";
import { parsePicture, writePicture } from "./picture_processor";
export function readFigure(root: ParentNode): Element | undefined { return readElement(root, "figure"); }
export function parseFigure(element: Element): Figure {
  const caption = element.querySelector(":scope > figcaption");
  return { pictures: Array.from(element.querySelectorAll(":scope > img")).map(parsePicture), caption: caption ? parseFigureCaption(caption) : undefined };
}
export function writeFigure(value: Figure): string {
  return `<figure>${value.pictures.map(writePicture).join("")}${value.caption ? writeFigureCaption(value.caption) : ""}</figure>`;
}
