import type { Phrase } from "./phrase";
import { copySenseWithFreshUuid, type Sense } from "./sense";
import type { Word } from "./word";

/** Sense storage: Phrases's own counterpart for Sense (sense.ts's
 * own docstring on why a Sense is kept apart from Dictionary/Phrases
 * rather than folded into either). One SenseStore per Domain, alongside
 * that Domain's own Dictionary/Phrases (VocabularyLayer.senses,
 * data/layer.ts).
 *
 * Indexed by synsetId as well as uuid -- WordSeeder.seedWordNet's own
 * per-synset dedup (find-or-create the one Sense for this synset,
 * mirroring how it already finds-or-creates a Word/Phrase per lemma)
 * needs an O(1) synsetId lookup, not a linear scan of every seeded
 * Sense so far. Also indexes each Sense's own membership (registerMember/
 * membersOf) -- the O(1) lookup relatedWords() (word.ts) needs to expand
 * a Sense-to-Sense relationship edge back into the specific Words/Phrases
 * that lexicalize each side, and the one synonyms() itself needs to
 * answer "every other Word/Phrase that shares this one's own Sense"
 * without a stored SYNONYM edge for WordNet-derived synonymy at all
 * (word_seeder.ts's own seedWordNet, pass 1, no longer creates one). */
export class SenseStore {
  private senses: Sense[] = [];
  private readonly byUuid = new Map<string, Sense>();
  private readonly bySynsetId = new Map<string, Sense>();
  private readonly membersBySenseId = new Map<string, Array<Word | Phrase>>();

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

  /** Records that `member` lexicalizes `sense` -- sets `member.senseId`
   * (the field itself, word.ts's/phrase.ts's own docstring) and adds it
   * to that Sense's own membership index. Idempotent: calling this
   * again for a member already registered under the same Sense (a
   * reused Word/Phrase on a seedWordNet re-run) doesn't duplicate the
   * membership entry. */
  registerMember(sense: Sense, member: Word | Phrase): void {
    member.senseId = sense.uuid;
    const bucket = this.membersBySenseId.get(sense.uuid.value);
    if (bucket === undefined) {
      this.membersBySenseId.set(sense.uuid.value, [member]);
    } else if (!bucket.some((existing) => existing.uuid.value === member.uuid.value)) {
      bucket.push(member);
    }
  }

  /** Every Word/Phrase registered as lexicalizing the Sense named by
   * `senseId` (a Sense's own `uuid.value`), in registration order --
   * empty for an unknown or as-yet-memberless Sense. */
  membersOf(senseId: string): readonly (Word | Phrase)[] {
    return this.membersBySenseId.get(senseId)?.slice() ?? [];
  }

  /** Bootstraps this SenseStore with a copy of every Sense in `other`
   * -- Dictionary.seedFrom/Phrases.seedFrom's own exact counterpart,
   * used the same way (VocabularyLayer's own Physics-from-Common
   * snapshot). */
  seedFrom(other: SenseStore): void {
    for (const sense of other.senses) this.append(copySenseWithFreshUuid(sense));
  }
}
