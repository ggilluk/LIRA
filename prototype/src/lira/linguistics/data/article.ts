import type { Figure } from "./figure";
import type { Footer } from "./footer";
import type { Header } from "./header";
import type { OrderedList, UnorderedList } from "./list";
import type { Paragraph } from "./paragraph";
import type { Section } from "./section";
import type { Table } from "./table";

/** HTML5 <article>: a self-contained document-content unit. */
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
  return {
    paragraphs: [], sections: [], figures: [], tables: [],
    orderedLists: [], unorderedLists: [], ...init,
  };
}
