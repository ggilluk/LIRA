import type { BlockQuote } from "../../../data/html/text/block_quote";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readBlockQuote(root: ParentNode): Element | undefined { return readElement(root, "blockquote"); }
export function parseBlockQuote(element: Element): BlockQuote {
  return { linguisticUnits: textUnits(element), citeUrl: attribute(element, "cite") };
}
export function writeBlockQuote(value: BlockQuote): string {
  const cite = value.citeUrl ? ` cite="${escapeAttribute(value.citeUrl)}"` : "";
  return `<blockquote${cite}>${writeTextUnits(value.linguisticUnits)}</blockquote>`;
}
