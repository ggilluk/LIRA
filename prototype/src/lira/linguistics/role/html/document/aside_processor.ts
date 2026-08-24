import type { Aside } from "../../../data/html/document/aside";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <aside> element from `root`. */
export function readAside(root: ParentNode): Element | undefined {
  return readElement(root, "aside");
}
/** Parse <aside> into LIRA Aside. Text triggers LinguisticUnit ingestion. */
export function parseAside(element: Element): Aside {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Aside back to HTML5 <aside>. */
export function writeAside(value: Aside): string {
  return `<aside>${writeTextUnits(value.linguisticUnits)}</aside>`;
}
