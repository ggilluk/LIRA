import type { Picture } from "../../../data/html/media/picture";
import { attribute, escapeAttribute, readElement } from "../processor_support";
export function readPicture(root: ParentNode): Element | undefined { return readElement(root, "img"); }
export function parsePicture(element: Element): Picture {
  const alt = attribute(element, "alt"); const width = attribute(element, "width"); const height = attribute(element, "height");
  return { source: attribute(element, "src") ?? "", alternateText: alt ? { text: alt } : undefined, width: width ? Number(width) : undefined, height: height ? Number(height) : undefined };
}
export function writePicture(value: Picture): string {
  const attributes = [`src="${escapeAttribute(value.source)}"`];
  if (value.alternateText?.text) attributes.push(`alt="${escapeAttribute(value.alternateText.text)}"`);
  if (value.width !== undefined) attributes.push(`width="${value.width}"`);
  if (value.height !== undefined) attributes.push(`height="${value.height}"`);
  return `<img ${attributes.join(" ")}>`;
}
