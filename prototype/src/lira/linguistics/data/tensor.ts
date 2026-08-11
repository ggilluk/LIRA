import type { LinguisticUnitKind } from "./linguistic_unit_kind";

/** Linguistics Layer tensor store: one growable row per linguistic unit
 * (Word, Punctuation, Clause, Sentence, Paragraph, Subject, UserPrompt).
 * Numeric fields live in one dense array, grown by doubling like
 * TensorLiraGraph's matrices -- amortized O(1) per allocation -- and
 * LinguisticSystemProperty reads/writes them by reference (Rule 14),
 * not as copied floats. Non-numeric per-row data (uuid, origin, the
 * live linguisticUnit backref, the conceptSystemProperty placeholder)
 * lives in plain arrays, mirroring TensorLiraGraph's own convention --
 * never packed into the tensor itself.
 *
 * kind is stored as kind's own numeric value directly:
 * LinguisticUnitKind's members are themselves numeric codes (Word=0,
 * Punctuation=1, ...), not string labels -- no separate code-lookup
 * table needed to put a kind in the tensor.
 *
 * Ported from linguistics/data/tensor.py. Python's numpy float64 array
 * becomes a Float64Array here -- same fixed-width, grow-by-doubling
 * discipline, browser-native (same pattern as vocabulary's own
 * LexicalRelationshipSystemPropertyTensor port). */
export const KIND_COL = 0;
export const SEQUENCE_COL = 1;
export const CONFIDENCE_COL = 2;
export const PROVENANCE_COL = 3;
export const TEMPORAL_COL = 4;
export const ACTIVATION_COL = 5;
export const INFERENCE_DEPTH_COL = 6;
export const VALENCE_COL = 7;
export const AROUSAL_COL = 8;
export const DOMINANCE_COL = 9;
export const N_COLS = 10;

export interface AllocateRowOptions {
  confidence?: number;
  provenance?: number;
  temporal?: number;
  activation?: number;
  inferenceDepth?: number;
  origin?: string;
  valence?: number;
  arousal?: number;
  dominance?: number;
}

export class LinguisticSystemPropertyTensor {
  private capacity: number;
  private nRows = 0;
  values: Float64Array;
  private readonly uuids: string[] = [];
  private readonly origins: (string | undefined)[] = [];
  private readonly linguisticUnits: unknown[] = [];
  private readonly conceptSystemProperties: unknown[] = [];

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
    kind: LinguisticUnitKind,
    sequenceNumber: number,
    uuidStr: string,
    linguisticUnit: unknown,
    conceptSystemProperty: unknown,
    options: AllocateRowOptions = {},
  ): number {
    if (this.nRows >= this.capacity) this.grow();
    const row = this.nRows;
    this.nRows += 1;

    this.values[this.cell(row, KIND_COL)] = kind;
    this.values[this.cell(row, SEQUENCE_COL)] = sequenceNumber;
    this.values[this.cell(row, CONFIDENCE_COL)] = options.confidence ?? 0.0;
    this.values[this.cell(row, PROVENANCE_COL)] = options.provenance ?? 0.0;
    this.values[this.cell(row, TEMPORAL_COL)] = options.temporal ?? 0.0;
    this.values[this.cell(row, ACTIVATION_COL)] = options.activation ?? 0.0;
    this.values[this.cell(row, INFERENCE_DEPTH_COL)] = options.inferenceDepth ?? 0;
    this.values[this.cell(row, VALENCE_COL)] = options.valence ?? 0.0;
    this.values[this.cell(row, AROUSAL_COL)] = options.arousal ?? 0.0;
    this.values[this.cell(row, DOMINANCE_COL)] = options.dominance ?? 0.0;

    this.uuids.push(uuidStr);
    this.origins.push(options.origin);
    this.linguisticUnits.push(linguisticUnit);
    this.conceptSystemProperties.push(conceptSystemProperty);
    return row;
  }

  getCell(row: number, col: number): number {
    return this.values[this.cell(row, col)];
  }

  setCell(row: number, col: number, value: number): void {
    this.values[this.cell(row, col)] = value;
  }

  kindOf(row: number): LinguisticUnitKind {
    return this.values[this.cell(row, KIND_COL)] as LinguisticUnitKind;
  }

  uuidOf(row: number): string {
    return this.uuids[row];
  }

  originOf(row: number): string | undefined {
    return this.origins[row];
  }

  linguisticUnitOf(row: number): unknown {
    return this.linguisticUnits[row];
  }

  conceptSystemPropertyOf(row: number): unknown {
    return this.conceptSystemProperties[row];
  }
}
