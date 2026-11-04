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
 * │ Module Name     │ lira/linguistics/role/html/processor_support
 * │ Filename        │ processor_support.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Helpers shared by every HTML element processor: element lookup,
 * │                 │ text-unit conversion and HTML escaping.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/processor_support
 * @file processor_support.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { LinguisticUnit } from "../../data/linguistic_unit";

export function readElement(root: ParentNode, selector: string): Element | undefined {
  return root.querySelector(selector) ?? undefined;
}
export function textUnits(element: Element): readonly LinguisticUnit[] {
  const text = element.textContent?.trim();
  return text ? [{ text }] : [];
}
export function writeTextUnits(units: readonly LinguisticUnit[]): string {
  return escapeHtml(units.map((unit) => unit.text).join(" "));
}
export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
export function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
export function attribute(element: Element, name: string): string | undefined {
  return element.getAttribute(name) ?? undefined;
}
