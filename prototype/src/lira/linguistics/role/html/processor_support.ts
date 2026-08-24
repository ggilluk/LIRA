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
