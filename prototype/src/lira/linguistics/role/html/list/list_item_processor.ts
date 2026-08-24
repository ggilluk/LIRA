import type { ListItem } from "../../../data/html/list/list_item";
import { readElement, textUnits, writeTextUnits } from "../processor_support";
export function readListItem(root: ParentNode): Element | undefined { return readElement(root, "li"); }
export function parseListItem(element: Element): ListItem { return { linguisticUnits: textUnits(element) }; }
export function writeListItem(value: ListItem): string { return `<li>${writeTextUnits(value.linguisticUnits)}</li>`; }
