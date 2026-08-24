import type { LinguisticUnit } from "./linguistic_unit";

/** HTML5 <li>. Any visible Text is materialised as LinguisticUnit data. */
export interface ListItem {
  linguisticUnits: readonly LinguisticUnit[];
}

export function createListItem(init: Partial<ListItem> = {}): ListItem {
  return { linguisticUnits: [], ...init };
}

/** HTML5 <ul>. */
export interface UnorderedList {
  items: readonly ListItem[];
}

export function createUnorderedList(init: Partial<UnorderedList> = {}): UnorderedList {
  return { items: [], ...init };
}

/** HTML5 <ol>. Array order is the source ordering. */
export interface OrderedList {
  items: readonly ListItem[];
  start?: number;
}

export function createOrderedList(init: Partial<OrderedList> = {}): OrderedList {
  return { items: [], ...init };
}

/** One HTML5 <dt>/<dd> association within a <dl>. */
export interface DescriptionEntry {
  terms: readonly LinguisticUnit[];
  values: readonly LinguisticUnit[];
}

/** HTML5 <dl>. */
export interface DescriptionList {
  entries: readonly DescriptionEntry[];
}

export function createDescriptionList(init: Partial<DescriptionList> = {}): DescriptionList {
  return { entries: [], ...init };
}
