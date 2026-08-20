import type { SemanticRelationship } from "./semantic_relationship";

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
}
