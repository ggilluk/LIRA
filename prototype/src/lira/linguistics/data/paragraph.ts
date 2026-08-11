import type { LinguisticUnit } from "./linguistic_unit";
import type { Sentence } from "./sentence";

/** Ported from linguistics/data/paragraph.py. */
export interface Paragraph extends LinguisticUnit {
  sentences: Sentence[];
}

export function createParagraph(init: Pick<Paragraph, "text"> & Partial<Paragraph>): Paragraph {
  return { sentences: [], ...init };
}
