import type { Dictionary } from "../data/dictionary";
import { toSyntheticWord } from "../data/phrase";
import type { Phrases } from "../data/phrases";
import { definitionWords, type Word } from "../data/word";
import { IdentificationSource, type WordIdentification } from "../data/word_identification";
import { createWordLookupContext } from "../data/word_lookup_context";
import type { AsyncDictionaryHydrator } from "./dictionary_hydrator";
import { PartOfSpeechIdentifier } from "./part_of_speech_identifier";

/** Resolves a raw token occurrence to zero or more candidate Words,
 * queuing background hydration when nothing in this Domain's
 * Dictionary matches yet. Never guesses a grammatical category: an
 * unresolved occurrence gets no Word at all until either the
 * seeded/previously-hydrated Dictionary or external hydration actually
 * supplies one (see WordIdentification's own docstring). Punctuation is
 * an ordinary Word (partOfSpeech=PUNCTUATION, seeded from
 * assets/common/en/punctuation.json, WordSeeder.MANDATORY_FILES) -- it
 * resolves through the same identifyWord path as any other mandatory
 * closed-class word, no special case needed here.
 *
 * Ported from vocabulary/role/dictionary_processor.py. */
export class DictionaryProcessor {
  private readonly partOfSpeechIdentifier: PartOfSpeechIdentifier;

  constructor(
    private readonly dictionary: Dictionary,
    private readonly phraseBook: Phrases,
    private readonly hydrator: AsyncDictionaryHydrator,
    private readonly domainName: string,
  ) {
    this.partOfSpeechIdentifier = new PartOfSpeechIdentifier(dictionary);
  }

  /** Returns every legitimate candidate sense for this occurrence,
   * ranked highest-confidence first -- an empty array means no seeded
   * or previously-hydrated Word matches yet, in which case external
   * hydration is queued and this call returns immediately without
   * creating anything. Choosing among more than one candidate for a
   * specific sentence occurrence (semantic disambiguation) is the
   * Linguistics Layer's job, not this method's. */
  identifyWord(
    rawTokenText: string,
    options: {
      sentenceIndex?: number;
      tokenIndex?: number;
      isSentenceStart?: boolean;
      precedingWords?: readonly string[];
      followingWords?: readonly string[];
    } = {},
  ): readonly WordIdentification[] {
    const context = createWordLookupContext({
      rawText: rawTokenText.trim(),
      normalisedText: rawTokenText.trim().toLowerCase(),
      domainName: this.domainName,
      sentenceIndex: options.sentenceIndex ?? 0,
      tokenIndex: options.tokenIndex ?? 0,
      isSentenceStart: options.isSentenceStart ?? false,
      precedingWords: options.precedingWords ?? [],
      followingWords: options.followingWords ?? [],
    });

    const seededCandidates = this.partOfSpeechIdentifier.identifySeeded(context);
    if (seededCandidates.length > 0) return seededCandidates;

    // No Word is created here. Hydration runs asynchronously and only
    // ever appends a Word once an external source actually supplies a
    // legitimate grammatical category for it.
    this.hydrator.queueHydration(context);
    return [];
  }

  /** The phrase-aware sibling of identifyWord: given the full raw token
   * sequence of a sentence and a start position within it, tries the
   * longest whitespace-joined span of consecutive raw tokens (bounded by
   * whichever of `phraseBook.spanLimit`/`dictionary.phraseSpanLimit` is
   * greater, down to 2) against the seeded Vocabulary before falling
   * back to a plain single-token identifyWord lookup -- "in spite of"
   * resolves as the one Phrase it's seeded as (assets/common/en/
   * prepositions.json, now via Phrases rather than a multi-word
   * Word -- Phrase's own docstring, data/phrase.ts), not three
   * independent single-word lookups on "in"/"spite"/"of". Checks
   * `phraseBook` AND `dictionary` at every span, not phraseBook alone:
   * a WordNet multi-word lemma ("toy poodle") is still an ordinary
   * multi-word Word, seeded into Dictionary exactly as before (Phrase
   * is closed-class-only, seedWordNet never creates one) -- so both
   * sources can legitimately have the winning match at the same span,
   * and both are offered as candidates when they do. Only the final
   * single-token fallback ever queues external hydration: a two-word
   * span that doesn't match anything ("in spite", i.e. the phrase minus
   * its last word) is not itself a candidate lexical form, so it must
   * not get treated as one just because the longer phrase search
   * happened to probe it first.
   *
   * Returns the winning candidates together with `tokenSpan`, the
   * number of raw tokens actually consumed (1 for an ordinary word). */
  identifyPhrase(
    rawTokens: readonly string[],
    startIndex: number,
    options: { sentenceIndex?: number; isSentenceStart?: boolean } = {},
  ): { candidates: readonly WordIdentification[]; tokenSpan: number } {
    const sentenceIndex = options.sentenceIndex ?? 0;
    const isSentenceStart = options.isSentenceStart ?? false;
    const spanBound = Math.max(this.dictionary.phraseSpanLimit, this.phraseBook.spanLimit);
    const maxSpan = Math.min(spanBound, rawTokens.length - startIndex);

    for (let span = maxSpan; span >= 2; span--) {
      const rawText = rawTokens.slice(startIndex, startIndex + span).join(" ");
      const context = createWordLookupContext({
        rawText,
        normalisedText: rawText.toLowerCase(),
        domainName: this.domainName,
        sentenceIndex,
        tokenIndex: startIndex,
        isSentenceStart,
        precedingWords: rawTokens.slice(0, startIndex),
        followingWords: rawTokens.slice(startIndex + span),
      });
      const candidates = [
        ...this.phraseIdentifications(context.normalisedText),
        ...this.partOfSpeechIdentifier.identifySeeded(context),
      ];
      if (candidates.length > 0) return { candidates, tokenSpan: span };
    }

    const candidates = this.identifyWord(rawTokens[startIndex], {
      sentenceIndex,
      tokenIndex: startIndex,
      isSentenceStart,
      precedingWords: rawTokens.slice(0, startIndex),
      followingWords: rawTokens.slice(startIndex + 1),
    });
    return { candidates, tokenSpan: 1 };
  }

  /** Every Phrase matching `normalisedText`, each materialised as a
   * WordIdentification via toSyntheticWord (phrase.ts's own docstring
   * on why a fresh, one-off Word is the correct thing to hand a
   * Linguistics-facing caller here, not a Dictionary lookup of any
   * kind). No casing-evidence confidence boost the way
   * PartOfSpeechIdentifier.identifySeeded gives PROPER_NOUN/SYMBOL --
   * no real Phrase is ever seeded as either, so there's nothing for
   * casing to support. */
  private phraseIdentifications(normalisedText: string): readonly WordIdentification[] {
    return this.phraseBook.lookupAll(normalisedText).map((phrase) => ({
      word: toSyntheticWord(phrase),
      partOfSpeech: phrase.partOfSpeech,
      source: IdentificationSource.SEEDED_VOCABULARY,
      confidence: 1.0,
      reason: "Exact lexical-form and grammatical-category match in the seeded Phrase Book.",
    }));
  }

  /** Registers `word` as a distinct sense of a lexical form already
   * present in this Dictionary under a different meaning -- the "keep
   * both, tell them apart by identity" resolution path for a
   * word-sense conflict. Neither `word.text` nor `word.lexicalForm` is
   * touched: both senses keep the identical, unmangled lexicalForm,
   * and stay distinguishable by their own `entryId` instead. */
  registerConflictingSense(word: Word): Word {
    this.dictionary.append(word);
    return word;
  }

  /** Walks `definitionWords(word, this.dictionary)` and queues external
   * hydration for every token that came back unresolved. A gap in one
   * Word's own definition is treated as a discovery signal, not a
   * blocker. Returns the distinct surface forms actually queued, in
   * first-seen order; a form already in-flight (AsyncDictionaryHydrator's
   * own dedup) is silently skipped. */
  queueDefinitionHydration(word: Word): readonly string[] {
    const queued: string[] = [];
    const seen = new Set<string>();
    for (const reference of definitionWords(word, this.dictionary)) {
      if (reference.word !== undefined) continue;
      const normalisedText = reference.text.toLowerCase();
      if (seen.has(normalisedText)) continue;
      seen.add(normalisedText);
      const context = createWordLookupContext({
        rawText: reference.text,
        normalisedText,
        domainName: this.domainName,
      });
      this.hydrator.queueHydration(context);
      queued.push(reference.text);
    }
    return queued;
  }
}
