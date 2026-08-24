import type { Button } from "../../../data/html/form/button";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <button> element from `root`. */
export function readButton(root: ParentNode): Element | undefined {
  return readElement(root, "button");
}
/** Parse <button> into LIRA Button. Text triggers LinguisticUnit ingestion. */
export function parseButton(element: Element): Button {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Button back to HTML5 <button>. */
export function writeButton(value: Button): string {
  return `<button>${writeTextUnits(value.linguisticUnits)}</button>`;
}
