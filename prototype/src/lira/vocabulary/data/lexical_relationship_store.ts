import type { LexicalRelationship } from "./lexical_relationship";

/** LexicalRelationship storage layer, mirroring Dictionary's storage
 * discipline. Ported from vocabulary/data/lexical_relationship_store.py.
 * The Python version is thread-safe (a lock around every access) --
 * JavaScript's single-threaded execution model gives that guarantee
 * for free, so no lock is ported. */
export class LexicalRelationshipStore {
  private relationships: LexicalRelationship[] = [];

  add(relationship: LexicalRelationship): void {
    this.relationships.push(relationship);
  }

  all(): readonly LexicalRelationship[] {
    return this.relationships.slice();
  }

  outgoing(sourceWordId: string): readonly LexicalRelationship[] {
    return this.relationships.filter((r) => r.sourceWordId.value === sourceWordId);
  }

  incoming(targetWordId: string): readonly LexicalRelationship[] {
    return this.relationships.filter((r) => r.targetWordId.value === targetWordId);
  }

  totalRelationships(): number {
    return this.relationships.length;
  }
}
