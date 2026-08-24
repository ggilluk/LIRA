import type { FigureCaption } from "./figure_caption";
import type { Picture } from "./picture";

/** HTML5 <figure>. */
export interface Figure {
  pictures: readonly Picture[];
  caption?: FigureCaption;
}

export function createFigure(init: Partial<Figure> = {}): Figure {
  return { pictures: [], ...init };
}
