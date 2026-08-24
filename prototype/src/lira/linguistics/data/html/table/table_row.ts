import type { TableCell } from "./table_cell";

/** HTML5 <tr>. */
export interface TableRow {
  cells: readonly TableCell[];
}
