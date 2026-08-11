import type { Dictionary } from "../data/dictionary";
import { definitionWords, type Word } from "../data/word";
import type { WordIdentification } from "../data/word_identification";
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
