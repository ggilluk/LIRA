import type { Figure } from "../../../data/html/media/figure";
import { readElement } from "../processor_support";
import { parseFigureCaption, writeFigureCaption } from "./figure_caption_processor";
import { parsePicture, writePicture } from "./picture_processor";
export function readFigure(root: ParentNode): Element | undefined { return readElement(root, "figure"); }
export function parseFigure(element: Element): Figure {
  const caption = element.querySelector(":scope > figcaption");
  return { pictures: Array.from(element.querySelectorAll(":scope > img")).map(parsePicture), caption: caption ? parseFigureCaption(caption) : undefined };
}
export function writeFigure(value: Figure): string {
  return `<figure>${value.pictures.map(writePicture).join("")}${value.caption ? writeFigureCaption(value.caption) : ""}</figure>`;
}
