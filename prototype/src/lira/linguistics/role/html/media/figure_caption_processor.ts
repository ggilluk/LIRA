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
