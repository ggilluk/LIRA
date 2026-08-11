import type { LinguisticUnit } from "./linguistic_unit";
import type { Paragraph } from "./paragraph";

/** Ported from linguistics/data/subject.py. */
export interface Subject extends LinguisticUnit {
  paragraphs: Paragraph[];
}

export function createSubject(init: Pick<Subject, "text"> & Partial<Subject>): Subject {
  return { paragraphs: [], ...init };
}
