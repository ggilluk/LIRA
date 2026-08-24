import type { LinguisticUnit } from "./linguistic_unit";

/** HTML5 <img>. Binary image content is referenced by source; alternate Text
 * is linguistic input rather than being treated as a URL/string label. */
export interface Picture {
  source: string;
  alternateText?: LinguisticUnit;
  width?: number;
  height?: number;
}

/** HTML5 <figcaption>. */
export interface FigureCaption {
  linguisticUnits: readonly LinguisticUnit[];
}

/** HTML5 <figure>: associates media with its caption/context. */
export interface Figure {
  pictures: readonly Picture[];
  caption?: FigureCaption;
}

export function createFigure(init: Partial<Figure> = {}): Figure {
  return { pictures: [], ...init };
}
