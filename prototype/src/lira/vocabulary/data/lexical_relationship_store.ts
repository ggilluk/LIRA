import type { LexicalRelationship } from "./lexical_relationship";

/** LexicalRelationship storage layer, mirroring Dictionary's storage
 * discipline. Ported from vocabulary/data/lexical_relationship_store.py.
 * The Python version is thread-safe (a lock around every access) --
 * JavaScript's single-threaded execution model gives that guarantee
 * for free, so no lock is ported.
 *
 * `bySource`/`byTarget` are this prototype's own addition (no Python
 * equivalent, same reasoning as Dictionary's own byText/byUuid maps --
 * that class's own module docstring): outgoing()/incoming() used to be
 * a linear scan over every relationship, fine for the few thousand
 * Common Vocabulary Relationship Cache edges this was first measured
 * against, but WordSeeder.seedWordNet (role/word_seeder.ts) and
 * DictionaryView.wordRecords (ui/dictionary_view.ts, one outgoing()+
 * incoming() call per Word to compute its relationship_count) both call
 * this at WordNet scale -- tens of thousands of Words against over a
 * hundred thousand relationships -- where a per-call linear scan
 * multiplies out to billions of comparisons and never realistically
 * finishes. Indexed by wordId instead, both methods are O(1) amortized,
 * same as Dictionary's own lookup()/lookupAll(). */
export class LexicalRelationshipStore {
  private relationships: LexicalRelationship[] = [];
  private readonly bySource = new Map<string, LexicalRelationship[]>();
  private readonly byTarget = new Map<string, LexicalRelationship[]>();

  add(relationship: LexicalRelationship): void {
    this.relationships.push(relationship);
    this.indexBucket(this.bySource, relationship.sourceWordId.value).push(relationship);
    this.indexBucket(this.byTarget, relationship.targetWordId.value).push(relationship);
  }

  all(): readonly LexicalRelationship[] {
    return this.relationships.slice();
  }

  outgoing(sourceWordId: string): readonly LexicalRelationship[] {
    return this.bySource.get(sourceWordId)?.slice() ?? [];
  }

  incoming(targetWordId: string): readonly LexicalRelationship[] {
    return this.byTarget.get(targetWordId)?.slice() ?? [];
  }

  totalRelationships(): number {
    return this.relationships.length;
  }

  private indexBucket(index: Map<string, LexicalRelationship[]>, wordId: string): LexicalRelationship[] {
    const bucket = index.get(wordId);
    if (bucket) return bucket;
    const fresh: LexicalRelationship[] = [];
    index.set(wordId, fresh);
    return fresh;
  }
}
