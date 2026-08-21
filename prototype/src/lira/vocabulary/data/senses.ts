import type { Phrase } from "./phrase";
import { copySenseWithFreshUuid, type Sense } from "./sense";
import type { Word } from "./entities/word";

/** Sense storage: Phrases's own counterpart for Sense (sense.ts's
 * own docstring on why a Sense is kept apart from Dictionary/Phrases
 * rather than folded into either). One Senses store per Domain, alongside
 * that Domain's own Dictionary/Phrases (VocabularyContext.senses,
 * data/vocabulary_context.ts).
 *
 * Indexed by synsetId as well as uuid -- WordSeeder.seedWordNet's own
 * per-synset dedup (find-or-create the one Sense for this synset,
 * mirroring how it already finds-or-creates a Word/Phrase per lemma)
 * needs an O(1) synsetId lookup, not a linear scan of every seeded
 * Sense so far. Also indexes each Sense's own membership (registerMember/
 * membersOf) -- the O(1) lookup relatedWords() (role/word_processor.ts) needs to expand
 * a Sense-to-Sense relationship edge back into the specific Words/Phrases
 * that lexicalize each side, and the one synonyms() itself needs to
 * answer "every other Word/Phrase that shares this one's own Sense"
 * without a stored SYNONYM edge for WordNet-derived synonymy at all
 * (word_seeder.ts's own seedWordNet, pass 1, no longer creates one). */
export class Senses {
  private senses: Sense[] = [];
  private readonly byUuid = new Map<string, Sense>();
  private readonly bySynsetId = new Map<string, Sense>();
  private readonly membersBySenseId = new Map<string, Array<Word | Phrase>>();
  private readonly memberMetadata = new Map<string, Readonly<Record<string, unknown>>>();

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

  /** Records that `member` lexicalizes `sense` -- appends `sense.uuid`
   * onto `member.senseIds` (the field itself, data/entities/word.ts's/phrase.ts's own
   * docstring) and adds `member` to that Sense's own membership index.
   * A Word/Phrase is now unique by (partOfSpeech, lemma), not by Sense
   * (WordSeeder.seedWordNet's own find-or-create, role/word_seeder.ts),
   * so `member` having already been registered under a *different*
   * Sense before this call is the ordinary case for a polysemous lemma,
   * not an edge case -- this only ever appends, never overwrites.
   * Idempotent either way: calling this again for a member already
   * registered under this exact same Sense (a reused Word/Phrase on a
   * seedWordNet re-run) doesn't duplicate either the `senseIds` entry
   * or the membership entry. */
  registerMember(sense: Sense, member: Word | Phrase): void {
    if (!member.senseIds.some((id) => id.value === sense.uuid.value)) {
      member.senseIds = [...member.senseIds, sense.uuid];
    }
    const bucket = this.membersBySenseId.get(sense.uuid.value);
    if (bucket === undefined) {
      this.membersBySenseId.set(sense.uuid.value, [member]);
    } else if (!bucket.some((existing) => existing.uuid.value === member.uuid.value)) {
      bucket.push(member);
    }
  }

  /** Opaque, per-(Sense, member) metadata -- deliberately untyped here
   * (`Senses` sits lower in the layering than any one POS subtype, so it
   * shouldn't need to import e.g. Verb/Adjective just to type this):
   * Verb.framesForSense()/Adjective.syntacticPositionForSense() (verb.ts/
   * adjective.ts) are the typed readers, and WordSeeder.seedWordNet
   * (role/word_seeder.ts) is the only writer, called once per synset
   * member right after registerMember() for that same (sense, member)
   * pair. Exists because a fact like a verb's own applicable sentence
   * frames, or an adjective's own syntactic position restriction, is
   * genuinely a property of *this word in this sense*, not of the word
   * standing alone -- two different Senses the same Word now lexicalizes
   * (Word.senseIds's own docstring) can carry two different answers. */
  setMemberMetadata(senseId: string, memberUuid: string, metadata: Readonly<Record<string, unknown>>): void {
    this.memberMetadata.set(`${senseId}|${memberUuid}`, metadata);
  }

  /** setMemberMetadata()'s own read side -- undefined when nothing was
   * ever set for this exact (senseId, memberUuid) pair. */
  metadataFor(senseId: string, memberUuid: string): Readonly<Record<string, unknown>> | undefined {
    return this.memberMetadata.get(`${senseId}|${memberUuid}`);
  }

  /** Every Word/Phrase registered as lexicalizing the Sense named by
   * `senseId` (a Sense's own `uuid.value`), in registration order --
   * empty for an unknown or as-yet-memberless Sense. */
  membersOf(senseId: string): readonly (Word | Phrase)[] {
    return this.membersBySenseId.get(senseId)?.slice() ?? [];
  }

  /** Bootstraps this Senses store with a copy of every Sense in `other`
   * -- Dictionary.seedFrom/Phrases.seedFrom's own exact counterpart,
   * used the same way (VocabularyContext's own Physics-from-Common
   * snapshot). */
  seedFrom(other: Senses): void {
    for (const sense of other.senses) this.append(copySenseWithFreshUuid(sense));
  }
}
