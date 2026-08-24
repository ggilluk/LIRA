import type { FieldSet } from "../../../data/html/form/field_set";
import { readElement } from "../processor_support";
import { parseInput, writeInput } from "./input_processor";
import { parseLegend, writeLegend } from "./legend_processor";
import { parseSelection, writeSelection } from "./selection_processor";
import { parseTextArea, writeTextArea } from "./text_area_processor";
export function readFieldSet(root: ParentNode): Element | undefined { return readElement(root, "fieldset"); }
export function parseFieldSet(element: Element): FieldSet {
  const legend = element.querySelector(":scope > legend");
  const controls = Array.from(element.children).filter((child) => ["INPUT", "TEXTAREA", "SELECT"].includes(child.tagName)).map((child) =>
    child.tagName === "INPUT" ? parseInput(child) : child.tagName === "TEXTAREA" ? parseTextArea(child) : parseSelection(child));
  return { legend: legend ? parseLegend(legend) : undefined, controls };
}
export function writeFieldSet(value: FieldSet): string {
  const controls = value.controls.map((control) => "type" in control ? writeInput(control) : "options" in control ? writeSelection(control) : writeTextArea(control)).join("");
  return `<fieldset>${value.legend ? writeLegend(value.legend) : ""}${controls}</fieldset>`;
}
