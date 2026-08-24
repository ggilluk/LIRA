import type { Video } from "../../../data/html/media/video";
import { attribute, escapeAttribute, readElement } from "../processor_support";
export function readVideo(root: ParentNode): Element | undefined { return readElement(root, "video"); }
export function parseVideo(element: Element): Video { return { source: attribute(element, "src") ?? "", poster: attribute(element, "poster") }; }
export function writeVideo(value: Video): string {
  const poster = value.poster ? ` poster="${escapeAttribute(value.poster)}"` : "";
  return `<video src="${escapeAttribute(value.source)}"${poster}></video>`;
}
