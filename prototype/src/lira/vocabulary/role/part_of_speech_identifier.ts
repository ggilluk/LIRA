import type { Dictionary } from "../data/dictionary";
import { PartOfSpeech } from "../data/part_of_speech";
import { IdentificationSource, type WordIdentification } from "../data/word_identification";
import { isTitleCase, isUpperCase, type WordLookupContext } from "../data/word_lookup_context";

/** Identifies candidate parts of speech for one token occurrence from
 * this Domain's Dictionary -- whether the matching Word was loaded by
 * WordSeeder or added by a previous AsyncDictionaryHydrator run
 * (Dictionary.lookupAll makes no distinction). Does not perform
 * external lookup and does not create Words; it only ranks whatever
 * candidates already exist using observable occurrence evidence
 * (casing so far). Uses lookupAll(), not lookup() -- LIRA models
 * homographs (a pronoun and numeral "one", a preposition and particle
 * "up") as separate Word records sharing one surface form, and every
 * legitimate sense must be returned as a candidate, not just whichever
 * was seeded first.
 *
 * Ported from vocabulary/role/part_of_speech_identifier.py. */
export class PartOfSpeechIdentifier {
  constructor(private readonly dictionary: Dictionary) {}

  identifySeeded(context: WordLookupContext): readonly WordIdentification[] {
    const seededWords = this.dictionary.lookupAll(context.normalisedText);

    const candidates: WordIdentification[] = seededWords.map((word) => ({
      word,
      partOfSpeech: word.partOfSpeech,
      source: IdentificationSource.SEEDED_VOCABULARY,
      confidence: this.seededConfidence(word.partOfSpeech, context),
      reason: this.seededReason(word.partOfSpeech, context),
    }));

    // Stable sort: candidates tied on confidence (the common case --
    // casing evidence only ever applies to PROPER_NOUN/SYMBOL) keep
    // Dictionary.lookupAll's own order, i.e. seeding/insertion order --
    // Array.prototype.sort is a stable sort in every engine this
    // targets (ECMA-262 since ES2019).
    candidates.sort((a, b) => b.confidence - a.confidence);

    return candidates;
  }

  private titleCaseSupports(partOfSpeech: PartOfSpeech, context: WordLookupContext): boolean {
    return partOfSpeech === PartOfSpeech.PROPER_NOUN && isTitleCase(context) && !context.isSentenceStart;
  }

  private upperCaseSupports(partOfSpeech: PartOfSpeech, context: WordLookupContext): boolean {
    return partOfSpeech === PartOfSpeech.SYMBOL && isUpperCase(context);
  }

  private seededConfidence(partOfSpeech: PartOfSpeech, context: WordLookupContext): number {
    let confidence = 1.0;
    if (this.titleCaseSupports(partOfSpeech, context)) confidence += 0.15;
    if (this.upperCaseSupports(partOfSpeech, context)) confidence += 0.1;
    return confidence;
  }

  private seededReason(partOfSpeech: PartOfSpeech, context: WordLookupContext): string {
    const reasons = ["Exact lexical-form and grammatical-category match in the seeded LIRA Vocabulary."];
    if (this.titleCaseSupports(partOfSpeech, context)) {
      reasons.push("Non-sentence-initial title casing supports the proper-noun candidate.");
    }
    if (this.upperCaseSupports(partOfSpeech, context)) {
      reasons.push("Upper casing supports the symbol candidate.");
    }
    return reasons.join(" ");
  }
}
