import type { Heading } from "../../heading";
import type { Paragraph } from "../../paragraph";
import type { OrderedList } from "../list/ordered_list";
import type { UnorderedList } from "../list/unordered_list";
import type { Figure } from "../media/figure";
import type { Table } from "../table/table";

/** HTML5 <section>. */
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
  return { paragraphs: [], sections: [], figures: [], tables: [], orderedLists: [], unorderedLists: [], ...init };
}
