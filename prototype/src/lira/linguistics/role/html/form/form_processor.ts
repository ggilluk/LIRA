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
 * │ Module Name     │ lira/linguistics/role/html/form/form_processor
 * │ Filename        │ form_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Form (HTML5 <form>) for HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/form/form_processor
 * @file form_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Form } from "../../../data/html/form/form";
import { readElement } from "../processor_support";
import { parseFieldSet, writeFieldSet } from "./field_set_processor";
import { parseInput, writeInput } from "./input_processor";
import { parseLabel, writeLabel } from "./label_processor";
import { parseSelection, writeSelection } from "./selection_processor";
import { parseTextArea, writeTextArea } from "./text_area_processor";
export function readForm(root: ParentNode): Element | undefined { return readElement(root, "form"); }
export function parseForm(element: Element): Form {
  const controls = Array.from(element.children).filter((child) => ["INPUT", "TEXTAREA", "SELECT"].includes(child.tagName)).map((child) =>
    child.tagName === "INPUT" ? parseInput(child) : child.tagName === "TEXTAREA" ? parseTextArea(child) : parseSelection(child));
  return { fieldSets: Array.from(element.querySelectorAll(":scope > fieldset")).map(parseFieldSet), controls, labels: Array.from(element.querySelectorAll(":scope > label")).map(parseLabel) };
}
export function writeForm(value: Form): string {
  const controls = value.controls.map((control) => "type" in control ? writeInput(control) : "options" in control ? writeSelection(control) : writeTextArea(control)).join("");
  return `<form>${value.labels.map(writeLabel).join("")}${value.fieldSets.map(writeFieldSet).join("")}${controls}</form>`;
}
