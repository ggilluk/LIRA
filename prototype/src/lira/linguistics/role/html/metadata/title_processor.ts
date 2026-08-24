import type { Title } from "../../../data/html/metadata/title";
import { escapeHtml, readElement } from "../processor_support";
export function readTitle(root: ParentNode): Element | undefined { return readElement(root, "title"); }
export function parseTitle(element: Element): Title { return { text: element.textContent?.trim() ?? "" }; }
export function writeTitle(value: Title): string { return `<title>${escapeHtml(value.text)}</title>`; }
