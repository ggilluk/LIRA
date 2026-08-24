import type { Footer } from "../../../data/html/document/footer";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <footer> element from `root`. */
export function readFooter(root: ParentNode): Element | undefined {
  return readElement(root, "footer");
}
/** Parse <footer> into LIRA Footer. Text triggers LinguisticUnit ingestion. */
export function parseFooter(element: Element): Footer {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Footer back to HTML5 <footer>. */
export function writeFooter(value: Footer): string {
  return `<footer>${writeTextUnits(value.linguisticUnits)}</footer>`;
}
