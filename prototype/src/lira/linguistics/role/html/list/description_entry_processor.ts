import type { DescriptionEntry } from "../../../data/html/list/description_entry";
import { textUnits, writeTextUnits } from "../processor_support";
/** Read one <dt> and its following <dd> siblings as a single entry. */
export function readDescriptionEntry(term: Element): readonly Element[] {
  const elements: Element[] = [term];
  for (let next = term.nextElementSibling; next?.tagName === "DD"; next = next.nextElementSibling) elements.push(next);
  return elements;
}
export function parseDescriptionEntry(elements: readonly Element[]): DescriptionEntry {
  return { terms: elements.filter((e) => e.tagName === "DT").flatMap(textUnits), values: elements.filter((e) => e.tagName === "DD").flatMap(textUnits) };
}
export function writeDescriptionEntry(value: DescriptionEntry): string {
  return value.terms.map((u) => `<dt>${writeTextUnits([u])}</dt>`).join("") +
    value.values.map((u) => `<dd>${writeTextUnits([u])}</dd>`).join("");
}
