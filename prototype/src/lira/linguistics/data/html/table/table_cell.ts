import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <th> or <td>. */
export interface TableCell {
  header: boolean;
  linguisticUnits: readonly LinguisticUnit[];
  columnSpan: number;
  rowSpan: number;
  scope?: "row" | "col" | "rowgroup" | "colgroup";
}
