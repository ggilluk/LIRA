import type { LexicalRelationship } from "./lexical_relationship";
import { SystemPropertiesRef } from "./system_properties_ref";
import type { LexicalRelationshipSystemPropertyTensor } from "./lexical_relationship_tensor";

/** A LexicalRelationship's own saved shape -- `SemanticRelationshipStore`'s
 * own `SavedSemanticRelationship` counterpart (data/semantic_relationship_store.ts),
 * `systemProperties`'s own four scalar readings flattened onto the
 * record the same way. */
export type SavedLexicalRelationship = Omit<LexicalRelationship, "systemProperties"> & {
  confidenceWeight: number;
  provenanceWeight: number;
  temporalValueWeight: number;
  activationWeight: number;
};

/** LexicalRelationship storage -- `SemanticRelationshipStore`'s own
 * exact shape (data/semantic_relationship_store.ts), indexed by
 * `sourceSenseId`/`targetSenseId` the identical way (not by
 * `sourceWordFormId`/`targetWordFormId` -- nothing queries this by
 * WordForm alone today; a Word's own `senseIds` is always the starting
 * point a caller already has, `builder_relationship.ts`'s own
 * `senseExpandedRelationships()` being the template this store's own
 * consumer, `ui/server/builder_lexical_relationship.ts`, mirrors). */
export class LexicalRelationshipStore {
  private relationships: LexicalRelationship[] = [];
  private readonly bySource = new Map<string, LexicalRelationship[]>();
  private readonly byTarget = new Map<string, LexicalRelationship[]>();

  add(relationship: LexicalRelationship): void {
    this.relationships.push(relationship);
    this.indexBucket(this.bySource, relationship.sourceSenseId.value).push(relationship);
    this.indexBucket(this.byTarget, relationship.targetSenseId.value).push(relationship);
  }

  all(): readonly LexicalRelationship[] {
    return this.relationships.slice();
  }

  outgoing(sourceSenseId: string): readonly LexicalRelationship[] {
    return this.bySource.get(sourceSenseId)?.slice() ?? [];
  }

  incoming(targetSenseId: string): readonly LexicalRelationship[] {
    return this.byTarget.get(targetSenseId)?.slice() ?? [];
  }

  totalRelationships(): number {
    return this.relationships.length;
  }

  private indexBucket(index: Map<string, LexicalRelationship[]>, senseId: string): LexicalRelationship[] {
    const bucket = index.get(senseId);
    if (bucket) return bucket;
    const fresh: LexicalRelationship[] = [];
    index.set(senseId, fresh);
    return fresh;
  }

  /** This store's own save/load snapshot -- `SemanticRelationshipStore.saveToFile()`'s
   * own exact counterpart: every relationship verbatim (uuids
   * unregenerated -- a saved `sourceWordFormId`/`targetWordFormId`
   * stays resolvable via `WordForms.findByUuid()`, a saved
   * `sourceSenseId`/`targetSenseId` via `Senses.findByUuid()`, once
   * those stores are reloaded the same way) plus each one's own four
   * tensor scalars flattened via `SavedLexicalRelationship`.
   * `bySource`/`byTarget` rebuild for free from `relationships` alone
   * via `add()`. */
  saveToFile(): { relationships: SavedLexicalRelationship[] } {
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

  /** saveToFile()'s own exact inverse -- `SemanticRelationshipStore.loadFromFile()`'s
   * own exact counterpart: clears this store's own collections first,
   * then for every saved relationship allocates a fresh row on `tensor`
   * (the owning `VocabularyContext`'s own `lexicalRelationshipTensor`,
   * threaded in the same way this store never holding a tensor
   * reference of its own) seeded with that relationship's own saved
   * scalars, wraps it in a fresh `SystemPropertiesRef`, and replays
   * `add()`. */
  loadFromFile(json: { relationships: readonly SavedLexicalRelationship[] }, tensor: LexicalRelationshipSystemPropertyTensor): void {
    this.relationships = [];
    this.bySource.clear();
    this.byTarget.clear();
    for (const { confidenceWeight, provenanceWeight, temporalValueWeight, activationWeight, ...rest } of json.relationships) {
      const row = tensor.allocateRow(rest.uuid.value, rest.version.value, confidenceWeight, provenanceWeight, temporalValueWeight, activationWeight);
      this.add({ ...rest, systemProperties: new SystemPropertiesRef(tensor, row) });
    }
  }
}
