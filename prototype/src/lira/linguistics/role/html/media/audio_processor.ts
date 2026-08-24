import type { Audio } from "../../../data/html/media/audio";
import { attribute, escapeAttribute, readElement } from "../processor_support";
export function readAudio(root: ParentNode): Element | undefined { return readElement(root, "audio"); }
export function parseAudio(element: Element): Audio { return { source: attribute(element, "src") ?? "" }; }
export function writeAudio(value: Audio): string { return `<audio src="${escapeAttribute(value.source)}"></audio>`; }
