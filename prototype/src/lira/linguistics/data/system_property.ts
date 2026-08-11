import type { LinguisticUnitKind } from "./linguistic_unit_kind";
import {
  ACTIVATION_COL,
  AROUSAL_COL,
  CONFIDENCE_COL,
  DOMINANCE_COL,
  INFERENCE_DEPTH_COL,
  type LinguisticSystemPropertyTensor,
  PROVENANCE_COL,
  SEQUENCE_COL,
  TEMPORAL_COL,
  VALENCE_COL,
} from "./tensor";

/** Placeholder representing a reference to a native graph or tensor
 * engine node (e.g. a concept in the Knowledge Layer's graph) -- not
 * wired up yet. Ported from linguistics/data/system_property.py. */
export class SystemPropertyRef {}

/** Bridge metadata attached to every linguistic unit. LinguisticSystemProperty
 * is a VIEW, not a value holder -- by-reference into
 * LinguisticSystemPropertyTensor (Rule 14), same discipline as
 * SystemPropertiesRef in the Vocabulary Layer: reading
 * sequenceConfidence reads the live tensor cell; writing it writes the
 * live cell, immediately visible to every other reference to that same
 * row.
 *
 * Ported from linguistics/data/system_property.py. */
export class LinguisticSystemProperty {
  constructor(
    private readonly store: LinguisticSystemPropertyTensor,
    private readonly row: number,
  ) {}

  get kind(): LinguisticUnitKind {
    return this.store.kindOf(this.row);
  }

  get sequenceNumber(): number {
    return this.store.getCell(this.row, SEQUENCE_COL);
  }

  get linguisticUnitUuid(): string {
    return this.store.uuidOf(this.row);
  }

  get linguisticUnit(): unknown {
    return this.store.linguisticUnitOf(this.row);
  }

  get conceptSystemProperty(): unknown {
    return this.store.conceptSystemPropertyOf(this.row);
  }

  get origin(): string | undefined {
    return this.store.originOf(this.row);
  }

  get sequenceConfidence(): number {
    return this.store.getCell(this.row, CONFIDENCE_COL);
  }

  set sequenceConfidence(value: number) {
    this.store.setCell(this.row, CONFIDENCE_COL, value);
  }

  get sequenceProvenance(): number {
    return this.store.getCell(this.row, PROVENANCE_COL);
  }

  set sequenceProvenance(value: number) {
    this.store.setCell(this.row, PROVENANCE_COL, value);
  }

  get sequenceTemporal(): number {
    return this.store.getCell(this.row, TEMPORAL_COL);
  }

  set sequenceTemporal(value: number) {
    this.store.setCell(this.row, TEMPORAL_COL, value);
  }

  get sequenceActivation(): number {
    return this.store.getCell(this.row, ACTIVATION_COL);
  }

  set sequenceActivation(value: number) {
    this.store.setCell(this.row, ACTIVATION_COL, value);
  }

  get inferenceDepth(): number {
    return this.store.getCell(this.row, INFERENCE_DEPTH_COL);
  }

  set inferenceDepth(value: number) {
    this.store.setCell(this.row, INFERENCE_DEPTH_COL, value);
  }

  get valenceWeight(): number {
    return this.store.getCell(this.row, VALENCE_COL);
  }

  set valenceWeight(value: number) {
    this.store.setCell(this.row, VALENCE_COL, value);
  }

  get arousalWeight(): number {
    return this.store.getCell(this.row, AROUSAL_COL);
  }

  set arousalWeight(value: number) {
    this.store.setCell(this.row, AROUSAL_COL, value);
  }

  get dominanceWeight(): number {
    return this.store.getCell(this.row, DOMINANCE_COL);
  }

  set dominanceWeight(value: number) {
    this.store.setCell(this.row, DOMINANCE_COL, value);
  }
}
