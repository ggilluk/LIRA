import { ACTIVATION_COL, CONFIDENCE_COL, N_COLS, PROVENANCE_COL, TEMPORAL_COL } from "./lexical_relationship_tensor";

/** SemanticRelationship system-properties tensor store --
 * LexicalRelationshipSystemPropertyTensor's own exact counterpart
 * (data/lexical_relationship_tensor.ts), one growable row per
 * SemanticRelationship instead. Shares that class's own column layout
 * (CONFIDENCE_COL/PROVENANCE_COL/TEMPORAL_COL/ACTIVATION_COL/N_COLS) --
 * both tensor classes satisfy the same RelationshipSystemPropertyTensor
 * shape SystemPropertiesRef needs, so importing the layout constants
 * here rather than redefining them keeps the two tensors from silently
 * drifting apart. Only SemanticRelationship gets a row here; Sense does
 * not (Design Principle 8, this class's own LexicalRelationship
 * counterpart's docstring). */
export class SemanticRelationshipSystemPropertyTensor {
  private capacity: number;
  private nRows = 0;
  values: Float64Array;
  private uuids: string[] = [];
  private versions: string[] = [];

  constructor(initialCapacity = 16) {
    this.capacity = initialCapacity;
    this.values = new Float64Array(this.capacity * N_COLS);
  }

  private grow(): void {
    const newCapacity = this.capacity * 2;
    const newValues = new Float64Array(newCapacity * N_COLS);
    newValues.set(this.values.subarray(0, this.nRows * N_COLS));
    this.values = newValues;
    this.capacity = newCapacity;
  }

  private cell(row: number, col: number): number {
    return row * N_COLS + col;
  }

  allocateRow(
    uuidStr: string,
    version: string,
    confidence = 0.0,
    provenance = 0.0,
    temporal = 0.0,
    activation = 0.0,
  ): number {
    if (this.nRows >= this.capacity) this.grow();
    const row = this.nRows;
    this.nRows += 1;

    this.values[this.cell(row, CONFIDENCE_COL)] = confidence;
    this.values[this.cell(row, PROVENANCE_COL)] = provenance;
    this.values[this.cell(row, TEMPORAL_COL)] = temporal;
    this.values[this.cell(row, ACTIVATION_COL)] = activation;

    this.uuids.push(uuidStr);
    this.versions.push(version);
    return row;
  }

  getCell(row: number, col: number): number {
    return this.values[this.cell(row, col)];
  }

  setCell(row: number, col: number, value: number): void {
    this.values[this.cell(row, col)] = value;
  }

  uuidOf(row: number): string {
    return this.uuids[row];
  }

  versionOf(row: number): string {
    return this.versions[row];
  }
}
