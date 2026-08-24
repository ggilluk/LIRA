import type { Header } from "../../../data/html/document/header";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <header> element from `root`. */
export function readHeader(root: ParentNode): Element | undefined {
  return readElement(root, "header");
}
/** Parse <header> into LIRA Header. Text triggers LinguisticUnit ingestion. */
export function parseHeader(element: Element): Header {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA Header back to HTML5 <header>. */
export function writeHeader(value: Header): string {
  return `<header>${writeTextUnits(value.linguisticUnits)}</header>`;
}
