import { ACTIVATION_COL, CONFIDENCE_COL, PROVENANCE_COL, TEMPORAL_COL } from "./morphological_pointer_relationship_tensor";
import type { RelationshipSystemPropertyTensor } from "./relationship_system_property_tensor";

/** SystemPropertiesRef: a MorphologicalPointerRelationship, LexicalRelationship,
 * or SemanticRelationship's
 * by-reference view into its own system-properties tensor
 * (RelationshipSystemPropertyTensor's own docstring on why one class
 * serves both) (Rule 14) -- reading confidenceWeight reads the live
 * tensor cell; writing it writes the live cell, immediately visible to
 * every other reference to that same row. Only a relationship record
 * carries one of these; Dictionary and Word do not (Design Principle 8).
 *
 * Ported from vocabulary/data/system_properties_ref.py. Python's
 * @property/setter pairs become get/set accessors here -- same
 * by-reference semantics. */
export class SystemPropertiesRef {
  constructor(
    private readonly store: RelationshipSystemPropertyTensor,
    private readonly row: number,
  ) {}

  get uuid(): string {
    return this.store.uuidOf(this.row);
  }

  get version(): string {
    return this.store.versionOf(this.row);
  }

  get confidenceWeight(): number {
    return this.store.getCell(this.row, CONFIDENCE_COL);
  }

  set confidenceWeight(value: number) {
    this.store.setCell(this.row, CONFIDENCE_COL, value);
  }

  get provenanceWeight(): number {
    return this.store.getCell(this.row, PROVENANCE_COL);
  }

  set provenanceWeight(value: number) {
    this.store.setCell(this.row, PROVENANCE_COL, value);
  }

  get temporalValueWeight(): number {
    return this.store.getCell(this.row, TEMPORAL_COL);
  }

  set temporalValueWeight(value: number) {
    this.store.setCell(this.row, TEMPORAL_COL, value);
  }

  get activationWeight(): number {
    return this.store.getCell(this.row, ACTIVATION_COL);
  }

  set activationWeight(value: number) {
    this.store.setCell(this.row, ACTIVATION_COL, value);
  }
}
