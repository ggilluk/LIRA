import type { PictureSet } from "../../../data/html/media/picture_set";
import { attribute, escapeAttribute, readElement } from "../processor_support";
export function readPictureSet(root: ParentNode): Element | undefined { return readElement(root, "picture"); }
export function parsePictureSet(element: Element): PictureSet {
  return { sources: Array.from(element.querySelectorAll(":scope > source")).map((source) => attribute(source, "srcset") ?? "").filter(Boolean) };
}
export function writePictureSet(value: PictureSet): string {
  return `<picture>${value.sources.map((source) => `<source srcset="${escapeAttribute(source)}">`).join("")}</picture>`;
}
