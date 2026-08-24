import type { Input } from "../../../data/html/form/input";
import { attribute, escapeAttribute, readElement } from "../processor_support";
export function readInput(root: ParentNode): Element | undefined { return readElement(root, "input"); }
export function parseInput(element: Element): Input { return { type: attribute(element, "type") ?? "text", name: attribute(element, "name"), value: attribute(element, "value") }; }
export function writeInput(value: Input): string {
  const attributes = [`type="${escapeAttribute(value.type)}"`];
  if (value.name) attributes.push(`name="${escapeAttribute(value.name)}"`);
  if (value.value !== undefined) attributes.push(`value="${escapeAttribute(value.value)}"`);
  return `<input ${attributes.join(" ")}>`;
}
