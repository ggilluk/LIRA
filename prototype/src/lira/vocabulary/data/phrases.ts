import type { Identifier } from "../../value_objects";
import { copyPhraseWithFreshUuid, graphUuid, type Phrase } from "./phrase";
import type { PartOfSpeech } from "./enums/part_of_speech";

/** Multi-word lexicon storage: Phrases is Dictionary's own counterpart
 * for Phrase (phrase.ts's own docstring on why the two are kept apart
 * rather than folding Phrase into Dictionary as just another kind of
 * Word). One Phrases store per Domain, alongside that Domain's own
 * Dictionary (VocabularyContext.phrases, data/vocabulary_context.ts).
 *
 * Deliberately a smaller surface than Dictionary: no formsByBase/
 * baseByForm lemma index (a closed-class multi-word phrase has no
 * inflected forms in the Common Vocabulary Cache today), no
 * phraseSpanLimit tracking of its OWN entries needing further phrase
 * search (every Phrase already IS the multi-word unit; there's no
 * shorter/longer variant search to bound). `spanLimit` instead reports
 * the longest phrase actually stored, for
 * DictionaryProcessor.identifyPhrase()'s own search bound -- the same
 * role Dictionary.phraseSpanLimit plays for a multi-word Word, kept
 * separate so a caller can combine both bounds without either store
 * needing to know the other exists. */
export class Phrases {
  private phrases: Phrase[] = [];
  private readonly byText = new Map<string, Phrase[]>();
  private readonly byUuid = new Map<string, Phrase>();
  /** WordNet-tagged part of speech for each Phrase, keyed by graphUuid.
   * Not a field on Phrase itself -- classifyPhraseType() already derives
   * `phraseType` from this same value at seeding time, and phraseType
   * cannot substitute for it as a dedup/lookup key: the PREPOSITIONAL_PHRASE
   * shape is reachable from both PartOfSpeech.ADJECTIVE and
   * PartOfSpeech.ADVERB, so only the original tag can tell those apart. */
  private readonly partOfSpeechByUuid = new Map<string, PartOfSpeech>();
  // WordNet's own synset identifier for each Phrase that has one, keyed
  // by graphUuid -- synsetIdOf()'s own backing store. Not a field on
  // Phrase itself (Phrase's own docstring on why): it's an externally-
  // defined WordNet attribute, mapped onto senseIds[0] rather than
  // duplicated as a scalar field.
  private readonly synsetIdByUuid = new Map<string, Identifier>();
  private maxSpan = 0;

  all(): readonly Phrase[] {
    return this.phrases.slice();
  }

  /** The greatest number of whitespace-separated words any appended
   * Phrase's own `text` spans -- 0 when this Phrases store is empty, so
   * combining it with Dictionary.phraseSpanLimit (Math.max) never
   * shrinks an existing search bound. */
  get spanLimit(): number {
    return this.maxSpan;
  }

  lookup(text: string): Phrase | undefined {
    const matches = this.lookupAll(text);
    return matches.length > 0 ? matches[0] : undefined;
  }

  /** Every Phrase whose surface text matches `text` (case-insensitive)
   * -- mirrors Dictionary.lookupAll's own homograph-preserving
   * behaviour, e.g. a phrase legitimately tagged more than one part of
   * speech under the identical wording. */
  lookupAll(text: string): readonly Phrase[] {
    return this.byText.get(text.toLowerCase())?.slice() ?? [];
  }

  findByUuid(phraseId: string): Phrase | undefined {
    return this.byUuid.get(phraseId);
  }

  /** `phrase`'s own WordNet-tagged part of speech, as supplied to
   * `append()` -- undefined for a Phrase this store never appended. */
  partOfSpeechOf(phrase: Phrase): PartOfSpeech | undefined {
    return this.partOfSpeechByUuid.get(graphUuid(phrase));
  }

  /** `phrase`'s own WordNet synset identifier, as supplied to `append()`
   * or a later `setSynsetId()` call -- undefined for a Phrase that
   * didn't come from WordNet, or that this store never appended. */
  synsetIdOf(phrase: Phrase): Identifier | undefined {
    return this.synsetIdByUuid.get(graphUuid(phrase));
  }

  /** Reassigns `phrase`'s own synset identifier -- `append()`'s own
   * `synsetId` parameter is this method's usual caller, but
   * WordSeeder.orderSensesByFrequency() also calls this directly once a
   * Phrase's own senses are reordered by real frequency, to keep this
   * value in sync with the new `senseIds[0]` (that method's own
   * docstring). Passing `undefined` clears any previously-set value. */
  setSynsetId(phrase: Phrase, synsetId: Identifier | undefined): void {
    if (synsetId !== undefined) this.synsetIdByUuid.set(graphUuid(phrase), synsetId);
    else this.synsetIdByUuid.delete(graphUuid(phrase));
  }

  append(phrase: Phrase, partOfSpeech: PartOfSpeech, synsetId?: Identifier): void {
    this.phrases.push(phrase);
    const key = phrase.text.toLowerCase();
    const bucket = this.byText.get(key);
    if (bucket) bucket.push(phrase);
    else this.byText.set(key, [phrase]);
    this.byUuid.set(graphUuid(phrase), phrase);
    this.partOfSpeechByUuid.set(graphUuid(phrase), partOfSpeech);
    if (synsetId !== undefined) this.synsetIdByUuid.set(graphUuid(phrase), synsetId);

    const wordCount = key.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > this.maxSpan) this.maxSpan = wordCount;
  }

  totalEntries(): number {
    return this.phrases.length;
  }

  /** Bootstraps this Phrases store with a copy of every Phrase in `other`
   * -- the Phrase counterpart of Dictionary.seedFrom, used the same
   * way (VocabularyContext's own Physics-from-Common snapshot). */
  seedFrom(other: Phrases): void {
    for (const phrase of other.phrases) {
      const partOfSpeech = other.partOfSpeechOf(phrase)!;
      const synsetId = other.synsetIdOf(phrase);
      this.append(copyPhraseWithFreshUuid(phrase), partOfSpeech, synsetId);
    }
  }
}
