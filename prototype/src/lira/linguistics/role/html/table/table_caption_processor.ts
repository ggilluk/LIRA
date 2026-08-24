import type { TableCaption } from "../../../data/html/table/table_caption";
import { readElement, textUnits, writeTextUnits } from "../processor_support";

/** Read the first HTML5 <caption> element from `root`. */
export function readTableCaption(root: ParentNode): Element | undefined {
  return readElement(root, "caption");
}
/** Parse <caption> into LIRA TableCaption. Text triggers LinguisticUnit ingestion. */
export function parseTableCaption(element: Element): TableCaption {
  return { linguisticUnits: textUnits(element) };
}
/** Write LIRA TableCaption back to HTML5 <caption>. */
export function writeTableCaption(value: TableCaption): string {
  return `<caption>${writeTextUnits(value.linguisticUnits)}</caption>`;
}
