import type { LexicalRelationship } from "./lexical_relationship";

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
}
