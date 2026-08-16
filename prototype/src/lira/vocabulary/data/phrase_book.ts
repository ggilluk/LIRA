import { copyPhraseWithFreshUuid, type Phrase } from "./phrase";

/** Multi-word lexicon storage: PhraseBook is Dictionary's own
 * counterpart for Phrase (phrase.ts's own docstring on why the two are
 * kept apart rather than folding Phrase into Dictionary as just
 * another kind of Word). One PhraseBook per Domain, alongside that
 * Domain's own Dictionary (VocabularyLayer.phrases, data/layer.ts).
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
export class PhraseBook {
  private phrases: Phrase[] = [];
  private readonly byText = new Map<string, Phrase[]>();
  private readonly byUuid = new Map<string, Phrase>();
  private maxSpan = 0;

  all(): readonly Phrase[] {
    return this.phrases.slice();
  }

  /** The greatest number of whitespace-separated words any appended
   * Phrase's own `text` spans -- 0 when this PhraseBook is empty, so
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

  append(phrase: Phrase): void {
    this.phrases.push(phrase);
    const key = phrase.text.toLowerCase();
    const bucket = this.byText.get(key);
    if (bucket) bucket.push(phrase);
    else this.byText.set(key, [phrase]);
    this.byUuid.set(phrase.uuid.value, phrase);

    const wordCount = key.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > this.maxSpan) this.maxSpan = wordCount;
  }

  totalEntries(): number {
    return this.phrases.length;
  }

  /** Bootstraps this PhraseBook with a copy of every Phrase in `other`
   * -- the Phrase counterpart of Dictionary.seedFrom, used the same
   * way (VocabularyLayer's own Physics-from-Common snapshot). */
  seedFrom(other: PhraseBook): void {
    for (const phrase of other.phrases) this.append(copyPhraseWithFreshUuid(phrase));
  }
}
