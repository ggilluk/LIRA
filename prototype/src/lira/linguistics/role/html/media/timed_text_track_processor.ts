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
 * │ Module Name     │ lira/linguistics/role/html/media/timed_text_track_processor
 * │ Filename        │ timed_text_track_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes TimedTextTrack (HTML5 <track>) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/media/timed_text_track_processor
 * @file timed_text_track_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
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
