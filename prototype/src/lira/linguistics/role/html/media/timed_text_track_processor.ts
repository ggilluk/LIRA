import type { TimedTextTrack } from "../../../data/html/media/timed_text_track";
import { attribute, escapeAttribute, readElement, textUnits, writeTextUnits } from "../processor_support";
export function readTimedTextTrack(root: ParentNode): Element | undefined { return readElement(root, "track"); }
export function parseTimedTextTrack(element: Element): TimedTextTrack {
  return { source: attribute(element, "src") ?? "", kind: attribute(element, "kind") ?? "", language: attribute(element, "srclang"), linguisticUnits: textUnits(element) };
}
export function writeTimedTextTrack(value: TimedTextTrack): string {
  const language = value.language ? ` srclang="${escapeAttribute(value.language)}"` : "";
  return `<track src="${escapeAttribute(value.source)}" kind="${escapeAttribute(value.kind)}"${language}>${writeTextUnits(value.linguisticUnits)}</track>`;
}
