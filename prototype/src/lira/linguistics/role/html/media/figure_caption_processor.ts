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
 * │ Module Name     │ lira/linguistics/role/html/media/figure_caption_processor
 * │ Filename        │ figure_caption_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes FigureCaption (HTML5 <figcaption>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/media/figure_caption_processor
 * @file figure_caption_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { FigureCaption } from "../../../data/html/media/figure_caption";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <figcaption> element from `root`. */
export function readFigureCaption(root: ParentNode): Element | undefined {
  return readElement(root, "figcaption");
}
/** Parse <figcaption> into LIRA FigureCaption. Text triggers LinguisticUnit ingestion. */
export function parseFigureCaption(element: Element): FigureCaption {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA FigureCaption back to HTML5 <figcaption>. */
export function writeFigureCaption(value: FigureCaption): string {
  return `<figcaption>${writeTextUnits(value.linguisticUnits)}</figcaption>`;
}
