import type { Metadata } from "../../../data/html/metadata/metadata";
import { attribute, escapeAttribute, readElement } from "../processor_support";
export function readMetadata(root: ParentNode): Element | undefined { return readElement(root, "meta"); }
export function parseMetadata(element: Element): Metadata {
  return { name: attribute(element, "name"), property: attribute(element, "property"), content: attribute(element, "content") };
}
export function writeMetadata(value: Metadata): string {
  const attributes: string[] = [];
  if (value.name !== undefined) attributes.push(`name="${escapeAttribute(value.name)}"`);
  if (value.property !== undefined) attributes.push(`property="${escapeAttribute(value.property)}"`);
  if (value.content !== undefined) attributes.push(`content="${escapeAttribute(value.content)}"`);
  return `<meta${attributes.length ? " " + attributes.join(" ") : ""}>`;
}
