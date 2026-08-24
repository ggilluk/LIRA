import type { Legend } from "../../../data/html/form/legend";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <legend> element from `root`. */
export function readLegend(root: ParentNode): Element | undefined {
  return readElement(root, "legend");
}
/** Parse <legend> into LIRA Legend. Text triggers LinguisticUnit ingestion. */
export function parseLegend(element: Element): Legend {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Legend back to HTML5 <legend>. */
export function writeLegend(value: Legend): string {
  return `<legend>${writeTextUnits(value.linguisticUnits)}</legend>`;
}
