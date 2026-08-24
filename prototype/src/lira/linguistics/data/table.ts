import type { LinguisticUnit } from "./linguistic_unit";

/** HTML5 <caption>. */
export interface TableCaption {
  linguisticUnits: readonly LinguisticUnit[];
}

/** HTML5 <th> or <td>. `header` distinguishes their semantic role. */
export interface TableCell {
  header: boolean;
  linguisticUnits: readonly LinguisticUnit[];
  columnSpan: number;
  rowSpan: number;
  scope?: "row" | "col" | "rowgroup" | "colgroup";
}

/** HTML5 <tr>. */
export interface TableRow {
  cells: readonly TableCell[];
}

/** HTML5 <thead>, <tbody>, or <tfoot>. */
export interface TableSection {
  rows: readonly TableRow[];
}

/** HTML5 <table>. Structural row/cell context is retained so cell Text is
 * not flattened into unrelated prose before linguistic interpretation. */
export interface Table {
  caption?: TableCaption;
  head?: TableSection;
  bodies: readonly TableSection[];
  footer?: TableSection;
}

export function createTable(init: Partial<Table> = {}): Table {
  return { bodies: [], ...init };
}
