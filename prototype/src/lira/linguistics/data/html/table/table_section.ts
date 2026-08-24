import type { TableRow } from "./table_row";

/** HTML5 <thead>, <tbody>, or <tfoot>. */
export interface TableSection {
  rows: readonly TableRow[];
}
