import type { Dictionary } from "../data/dictionary";
import { PartOfSpeech } from "../data/enums/part_of_speech";
import type { Word } from "../data/entities/word";
import { isTitleCase, isUpperCase, type WordLookupContext } from "../data/word_lookup_context";
import { IdentificationSource, type WordIdentifier } from "./word_identifier";

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

  /** An exact lookupAll() match always wins outright when one exists --
   * only once that comes back empty does this fall back to
   * Dictionary.lookupFormMatches(), which finds a Word by one of its own
   * generated *_Form values instead of its base spelling ("commas" ->
   * "comma" via pluralNumberForm, "ran" -> "run" via pastTenseForm).
   * This is the one choke point both DictionaryProcessor.identifyWord
   * and identifyPhrase call for every span they try (identifyPhrase's
   * own docstring), so the fallback covers ordinary single-word
   * identification and every phrase-search span alike without either
   * caller needing its own copy of this logic. An inflected match is
   * real evidence, just weaker than the Word's own canonical spelling,
   * so it's scored below every exact match (inflectedConfidence()) and
   * tagged IdentificationSource.INFLECTED_FORM rather than
   * SEEDED_VOCABULARY, with a reason naming the specific field that
   * matched. */
  identifySeeded(context: WordLookupContext): readonly WordIdentifier[] {
    const seededWords = this.dictionary.lookupAll(context.normalisedText);
    if (seededWords.length > 0) {
      const candidates: WordIdentifier[] = seededWords.map((word) => ({
        word,
        partOfSpeech: word.partOfSpeech,
        source: IdentificationSource.SEEDED_VOCABULARY,
        confidence: this.seededConfidence(word.partOfSpeech, context),
        reason: this.seededReason(word.partOfSpeech, context),
      }));
      candidates.sort((a, b) => b.confidence - a.confidence);
      return candidates;
    }

    const formMatches = this.dictionary.lookupFormMatches(context.normalisedText);
    const candidates: WordIdentifier[] = formMatches.map(({ word, field }) => ({
      word,
      partOfSpeech: word.partOfSpeech,
      source: IdentificationSource.INFLECTED_FORM,
      confidence: this.inflectedConfidence(),
      reason: this.inflectedReason(word, field, context),
    }));

    // Stable sort: candidates tied on confidence (the common case --
    // casing evidence only ever applies to PROPER_NOUN/SYMBOL, and
    // inflectedConfidence() never varies by candidate) keep the
    // underlying index's own insertion order -- Array.prototype.sort is
    // a stable sort in every engine this targets (ECMA-262 since
    // ES2019).
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

  // Below every possible seededConfidence() value (1.0 at minimum, only
  // ever higher with casing evidence) -- an exact match must always
  // outrank an inflected one when both exist for the same occurrence.
  // No casing-evidence bonus of its own: this candidate's own Word.text
  // is a different spelling than what was actually typed, so the same
  // title-/upper-case comparisons seededConfidence() makes wouldn't be
  // comparing the occurrence against its own real candidate spelling.
  private inflectedConfidence(): number {
    return 0.85;
  }

  private inflectedReason(word: Word, field: string, context: WordLookupContext): string {
    return `Matched "${context.rawText}" via this Word's own "${field}" form, not its base lexical form ("${word.text}").`;
  }
}
