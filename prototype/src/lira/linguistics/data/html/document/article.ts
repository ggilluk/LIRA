import type { Paragraph } from "../../paragraph";
import type { Figure } from "../media/figure";
import type { OrderedList } from "../list/ordered_list";
import type { UnorderedList } from "../list/unordered_list";
import type { Table } from "../table/table";
import type { Footer } from "./footer";
import type { Header } from "./header";
import type { Section } from "./section";

/** HTML5 <article>. */
export interface Article {
  header?: Header;
  paragraphs: readonly Paragraph[];
  sections: readonly Section[];
  figures: readonly Figure[];
  tables: readonly Table[];
  orderedLists: readonly OrderedList[];
  unorderedLists: readonly UnorderedList[];
  footer?: Footer;
}

export function createArticle(init: Partial<Article> = {}): Article {
  return { paragraphs: [], sections: [], figures: [], tables: [], orderedLists: [], unorderedLists: [], ...init };
}
