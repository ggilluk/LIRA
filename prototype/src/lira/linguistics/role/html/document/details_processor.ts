import type { Details } from "../../../data/html/document/details";
import { readElement, textUnits, writeTextUnits } from "../processor_support";
import { parseSummary, writeSummary } from "../text/summary_processor";
export function readDetails(root: ParentNode): Element | undefined { return readElement(root, "details"); }
export function parseDetails(element: Element): Details {
  const summary = element.querySelector(":scope > summary");
  return { summary: summary ? parseSummary(summary) : undefined, linguisticUnits: textUnits(element) };
}
export function writeDetails(value: Details): string {
  return `<details>${value.summary ? writeSummary(value.summary) : ""}${writeTextUnits(value.linguisticUnits)}</details>`;
}
