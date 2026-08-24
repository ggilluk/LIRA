import type { TableCaption } from "./table_caption";
import type { TableSection } from "./table_section";

/** HTML5 <table>. Structural context is retained before linguistic interpretation. */
export interface Table {
  caption?: TableCaption;
  head?: TableSection;
  bodies: readonly TableSection[];
  footer?: TableSection;
}

export function createTable(init: Partial<Table> = {}): Table {
  return { bodies: [], ...init };
}
