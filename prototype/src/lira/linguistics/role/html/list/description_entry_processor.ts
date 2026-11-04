/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/linguistics/role/html/list/description_entry_processor
 * │ Filename        │ description_entry_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes DescriptionEntry (an HTML5 <dt>/<dd>
 * │                 │ pair) for HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/list/description_entry_processor
 * @file description_entry_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
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
