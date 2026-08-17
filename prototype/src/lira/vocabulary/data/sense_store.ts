import { copySenseWithFreshUuid, type Sense } from "./sense";

/** Sense storage: PhraseBook's own counterpart for Sense (sense.ts's
 * own docstring on why a Sense is kept apart from Dictionary/PhraseBook
 * rather than folded into either). One SenseStore per Domain, alongside
 * that Domain's own Dictionary/PhraseBook (VocabularyLayer.senses,
 * data/layer.ts).
 *
 * Indexed by synsetId as well as uuid -- WordSeeder.seedWordNet's own
 * per-synset dedup (find-or-create the one Sense for this synset,
 * mirroring how it already finds-or-creates a Word/Phrase per lemma)
 * needs an O(1) synsetId lookup, not a linear scan of every seeded
 * Sense so far. */
export class SenseStore {
  private senses: Sense[] = [];
  private readonly byUuid = new Map<string, Sense>();
  private readonly bySynsetId = new Map<string, Sense>();

  all(): readonly Sense[] {
    return this.senses.slice();
  }

  findByUuid(senseId: string): Sense | undefined {
    return this.byUuid.get(senseId);
  }

  findBySynsetId(synsetId: string): Sense | undefined {
    return this.bySynsetId.get(synsetId);
  }

  append(sense: Sense): void {
    this.senses.push(sense);
    this.byUuid.set(sense.uuid.value, sense);
    if (sense.synsetId !== undefined) this.bySynsetId.set(sense.synsetId.value, sense);
  }

  totalEntries(): number {
    return this.senses.length;
  }

  /** Bootstraps this SenseStore with a copy of every Sense in `other`
   * -- Dictionary.seedFrom/PhraseBook.seedFrom's own exact counterpart,
   * used the same way (VocabularyLayer's own Physics-from-Common
   * snapshot). */
  seedFrom(other: SenseStore): void {
    for (const sense of other.senses) this.append(copySenseWithFreshUuid(sense));
  }
}
