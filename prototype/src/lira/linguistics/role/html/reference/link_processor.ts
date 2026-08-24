import type { Link } from "../../../data/html/reference/link";
import { attribute, escapeAttribute, readElement } from "../processor_support";
export function readLink(root: ParentNode): Element | undefined { return readElement(root, "link"); }
export function parseLink(element: Element): Link {
  return { relationship: attribute(element, "rel") ?? "", url: attribute(element, "href") ?? "", mediaType: attribute(element, "type") };
}
export function writeLink(value: Link): string {
  const type = value.mediaType ? ` type="${escapeAttribute(value.mediaType)}"` : "";
  return `<link rel="${escapeAttribute(value.relationship)}" href="${escapeAttribute(value.url)}"${type}>`;
}
