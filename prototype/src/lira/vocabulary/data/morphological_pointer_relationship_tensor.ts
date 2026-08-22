/** MorphologicalPointerRelationship system-properties tensor store: one growable row
 * per MorphologicalPointerRelationship, holding its confidence/provenance/temporal/
 * activation weights in one dense array, grown by doubling (Rule 14) --
 * the same discipline as LinguisticSystemPropertyTensor in the
 * Linguistics Layer. Only MorphologicalPointerRelationship gets a row here; Dictionary
 * and Word do not (Design Principle 8: tensor-backed system properties
 * apply only to word relationships, not to words standing alone).
 *
 * uuid and version are non-numeric per-row data and live in plain
 * arrays alongside the tensor, mirroring LinguisticSystemPropertyTensor's
 * _uuids/_origins convention -- never packed into the tensor itself.
 *
 * Ported from vocabulary/data/morphological_pointer_relationship_tensor.py. Python's
 * numpy float64 array becomes a Float64Array here -- same fixed-width,
 * grow-by-doubling discipline, browser-native. */
export const CONFIDENCE_COL = 0;
export const PROVENANCE_COL = 1;
export const TEMPORAL_COL = 2;
export const ACTIVATION_COL = 3;
export const N_COLS = 4;

export class MorphologicalPointerRelationshipSystemPropertyTensor {
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
