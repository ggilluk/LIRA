import type { Identifier } from "../../value_objects";
import { graphUuid as phraseGraphUuid, type Phrase } from "./phrase";
import { copySenseWithFreshUuid, graphUuid } from "../role/sense_processor";
import { graphUuid as wordGraphUuid } from "../role/word_processor";
import type { Sense } from "./entities/sense";
import type { Word } from "./entities/word";

/** `member`'s own per-Domain graph identity -- Phrase's own entryId
 * now carries the identical two-role shape Word's own does (both
 * folded from Identifier.uuid, `data/entities/word.ts`'s own
 * docstring), so this just picks which of the two matching graphUuid()
 * functions to call. */
export function memberUuid(member: Word | Phrase): string {
  return "words" in member ? phraseGraphUuid(member) : wordGraphUuid(member);
}

/** Sense storage: Phrases's own counterpart for Sense (data/entities/sense.ts's
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
  // WordNet's own synset identifier for each Sense, keyed by graphUuid --
  // synsetIdOf()'s own backing store. Not a field on Sense itself
  // (Sense's own docstring on why): this is `bySynsetId`'s own reverse
  // index, letting a caller go uuid -> synsetId as easily as
  // findBySynsetId() already goes synsetId -> Sense.
  private readonly synsetIdByUuid = new Map<string, Identifier>();
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

  /** `sense`'s own WordNet synset identifier, as supplied to `append()`
   * -- undefined for a Sense that didn't come from WordNet, or that
   * this store never appended. */
  synsetIdOf(sense: Sense): Identifier | undefined {
    return this.synsetIdByUuid.get(graphUuid(sense));
  }

  append(sense: Sense, synsetId?: Identifier): void {
    this.senses.push(sense);
    this.byUuid.set(graphUuid(sense), sense);
    if (synsetId !== undefined) {
      this.bySynsetId.set(synsetId.value, sense);
      this.synsetIdByUuid.set(graphUuid(sense), synsetId);
    }
  }

  totalEntries(): number {
    return this.senses.length;
  }

  /** Records that `member` lexicalizes `sense` -- for a Phrase, appends
   * `sense`'s own per-Domain graph uuid onto `member.senseIds` (the field itself, data/phrase.ts's
   * own docstring); a Word carries no `senseIds` of its own any more
   * (moved onto its base-lemma WordForm, data/entities/word_form.ts's own
   * docstring on why) -- WordForms.registerSense() is that field's own
   * write side now, called alongside this one at every real call site
   * (role/word_seeder.ts's own registerUniqueSense()/synset-member loop),
   * not something this method can do itself with no WordForms store of
   * its own to reach through. Also adds `member` to that Sense's own
   * membership index either way, Word and Phrase alike. A Word/Phrase is
   * now unique by (partOfSpeech, lemma), not by Sense
   * (WordSeeder.seedWordNet's own find-or-create, role/word_seeder.ts),
   * so `member` having already been registered under a *different*
   * Sense before this call is the ordinary case for a polysemous lemma,
   * not an edge case -- this only ever appends, never overwrites.
   * Idempotent either way: calling this again for a member already
   * registered under this exact same Sense (a reused Word/Phrase on a
   * seedWordNet re-run) doesn't duplicate either the `senseIds` entry
   * or the membership entry. */
  registerMember(sense: Sense, member: Word | Phrase): void {
    const senseUuid = graphUuid(sense);
    if ("words" in member && !member.senseIds.some((id) => id.value === senseUuid)) {
      member.senseIds = [...member.senseIds, { value: senseUuid }];
    }
    const bucket = this.membersBySenseId.get(senseUuid);
    if (bucket === undefined) {
      this.membersBySenseId.set(senseUuid, [member]);
    } else if (!bucket.some((existing) => memberUuid(existing) === memberUuid(member))) {
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
    for (const sense of other.senses) this.append(copySenseWithFreshUuid(sense), other.synsetIdOf(sense));
  }
}
