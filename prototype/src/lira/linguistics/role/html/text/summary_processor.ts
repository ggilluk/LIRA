import type { Summary } from "../../../data/html/text/summary";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <summary> element from `root`. */
export function readSummary(root: ParentNode): Element | undefined {
  return readElement(root, "summary");
}
/** Parse <summary> into LIRA Summary. Text triggers LinguisticUnit ingestion. */
export function parseSummary(element: Element): Summary {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Summary back to HTML5 <summary>. */
export function writeSummary(value: Summary): string {
  return `<summary>${writeTextUnits(value.linguisticUnits)}</summary>`;
}
