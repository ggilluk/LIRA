import type { SemanticRelationship } from "./semantic_relationship";
import { SystemPropertiesRef } from "./system_properties_ref";
import type { SemanticRelationshipSystemPropertyTensor } from "./semantic_relationship_tensor";

/** A SemanticRelationship's own saved shape -- `systemProperties` (a
 * live `SystemPropertiesRef`, by-reference into a tensor row, not JSON
 * data of its own -- that class's own docstring) is replaced by its
 * four scalar readings, flattened onto the record the same way
 * WordForms/Senses/Phrases bolt their own store-private data onto a
 * saved record (each store's own `saveToFile()` docstring). */
export type SavedSemanticRelationship = Omit<SemanticRelationship, "systemProperties"> & {
  confidenceWeight: number;
  provenanceWeight: number;
  temporalValueWeight: number;
  activationWeight: number;
};

/** SemanticRelationship storage layer -- LexicalRelationshipStore's own
 * exact counterpart (data/lexical_relationship_store.ts), indexed by
 * senseId instead of wordId. See that class's own docstring for the
 * bySource/byTarget indexing rationale, unchanged here. */
export class SemanticRelationshipStore {
  private relationships: SemanticRelationship[] = [];
  private readonly bySource = new Map<string, SemanticRelationship[]>();
  private readonly byTarget = new Map<string, SemanticRelationship[]>();

  add(relationship: SemanticRelationship): void {
    this.relationships.push(relationship);
    this.indexBucket(this.bySource, relationship.sourceSenseId.value).push(relationship);
    this.indexBucket(this.byTarget, relationship.targetSenseId.value).push(relationship);
  }

  all(): readonly SemanticRelationship[] {
    return this.relationships.slice();
  }

  outgoing(sourceSenseId: string): readonly SemanticRelationship[] {
    return this.bySource.get(sourceSenseId)?.slice() ?? [];
  }

  incoming(targetSenseId: string): readonly SemanticRelationship[] {
    return this.byTarget.get(targetSenseId)?.slice() ?? [];
  }

  totalRelationships(): number {
    return this.relationships.length;
  }

  private indexBucket(index: Map<string, SemanticRelationship[]>, senseId: string): SemanticRelationship[] {
    const bucket = index.get(senseId);
    if (bucket) return bucket;
    const fresh: SemanticRelationship[] = [];
    index.set(senseId, fresh);
    return fresh;
  }

  /** This store's own save/load snapshot -- every relationship verbatim
   * (`uuid`/`sourceSenseId`/`targetSenseId` unregenerated, `Dictionary.saveToFile()`'s
   * own docstring on why that's safe for a save/load round-trip -- a
   * Sense's own `senseId.uuid` a saved `sourceSenseId`/`targetSenseId`
   * points at stays resolvable via `Senses.findByUuid()` once `Senses`
   * is reloaded the same way) plus each one's own four tensor scalars,
   * `SavedSemanticRelationship`'s own docstring on why those need
   * flattening. `bySource`/`byTarget` aren't saved -- both rebuild for
   * free from `relationships` alone via `add()`. */
  saveToFile(): { relationships: SavedSemanticRelationship[] } {
    return {
      relationships: this.relationships.map(({ systemProperties, ...rest }) => ({
        ...rest,
        confidenceWeight: systemProperties.confidenceWeight,
        provenanceWeight: systemProperties.provenanceWeight,
        temporalValueWeight: systemProperties.temporalValueWeight,
        activationWeight: systemProperties.activationWeight,
      })),
    };
  }

  /** saveToFile()'s own exact inverse -- clears this store's own
   * collections first, then for every saved relationship allocates a
   * fresh row on `tensor` (the owning `VocabularyContext`'s own
   * `semanticRelationshipTensor`, threaded in the same way
   * `SemanticRelationshipProcessor.create()`'s own constructor already
   * is -- this store never holds a tensor reference of its own) seeded
   * with that relationship's own saved scalars, wraps it in a fresh
   * `SystemPropertiesRef`, and replays `add()` (rebuilding `bySource`/
   * `byTarget` for free). The tensor row index itself is never
   * persisted -- `SystemPropertiesRef`'s own `row` is process-local,
   * remade here in the same append order `create()` would have used. */
  loadFromFile(json: { relationships: readonly SavedSemanticRelationship[] }, tensor: SemanticRelationshipSystemPropertyTensor): void {
    this.relationships = [];
    this.bySource.clear();
    this.byTarget.clear();
    for (const { confidenceWeight, provenanceWeight, temporalValueWeight, activationWeight, ...rest } of json.relationships) {
      const row = tensor.allocateRow(rest.uuid.value, rest.version.value, confidenceWeight, provenanceWeight, temporalValueWeight, activationWeight);
      this.add({ ...rest, systemProperties: new SystemPropertiesRef(tensor, row) });
    }
  }
}
