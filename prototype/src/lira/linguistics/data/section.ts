import type { Figure } from "./figure";
import type { Heading } from "./heading";
import type { OrderedList, UnorderedList } from "./list";
import type { Paragraph } from "./paragraph";
import type { Table } from "./table";

/** HTML5 <section>, or an equivalent section recognised from heading scope
 * where a source page does not explicitly use <section>. */
export interface Section {
  heading?: Heading;
  paragraphs: readonly Paragraph[];
  sections: readonly Section[];
  figures: readonly Figure[];
  tables: readonly Table[];
  orderedLists: readonly OrderedList[];
  unorderedLists: readonly UnorderedList[];
}

export function createSection(init: Partial<Section> = {}): Section {
  return {
    paragraphs: [], sections: [], figures: [], tables: [],
    orderedLists: [], unorderedLists: [], ...init,
  };
}
