import type { Address } from "../../../data/html/text/address";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <address> element from `root`. */
export function readAddress(root: ParentNode): Element | undefined {
  return readElement(root, "address");
}
/** Parse <address> into LIRA Address. Text triggers LinguisticUnit ingestion. */
export function parseAddress(element: Element): Address {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Address back to HTML5 <address>. */
export function writeAddress(value: Address): string {
  return `<address>${writeTextUnits(value.linguisticUnits)}</address>`;
}
