import type { Dictionary } from "../data/dictionary";
import { PartOfSpeech } from "../data/enums/part_of_speech";
import { wordFormTypeLabel, type WordFormType } from "../data/enums/word_forms_enum";
import type { Word } from "../data/entities/word";
import { isTitleCase, isUpperCase, type WordLookupContext } from "../data/word_lookup_context";
import type { WordForms } from "../data/word_forms";
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
  constructor(
    private readonly dictionary: Dictionary,
    private readonly wordForms?: WordForms,
  ) {}

  /** An exact lookupAll() match and every WordForms.lookupByText() match
   * (every migrated POS subtype's own generated WordForm records, e.g.
   * "commas" -> "comma" via pluralNumberForm, "ran" -> "run" via
   * pastTenseForm, "was" -> "be" via a pastTenseInstanceForm WordForm --
   * every POS now registers its own inflected spellings there,
   * data/word_forms.ts's own docstring) are both always gathered and
   * merged, not one-or-the-other: a real, genuinely common English
   * spelling collision -- a participial adjective sharing its exact
   * spelling with a different Word's own inflected verb form ("surprised"
   * is both its own standalone ADJECTIVE lemma and VERB "surprise"'s own
   * past-participle spelling; "unlocked", "excited", "interested", ... the
   * same) -- used to make identifySeeded() return only the ADJECTIVE:
   * lookupAll("surprised") already found that exact match, so this used
   * to return outright, never even calling lookupByText() at all, hiding
   * the VERB reading completely from every caller (ClauseReader among
   * them: "That the door was unlocked surprised everyone." reads VALID
   * today only by accident, never correctly recognising "unlocked"/
   * "surprised" as VERB_PHRASE-capable at all --
   * linguistics/documentation/architecture/data_entity_design_decisions_log.md).
   * `exactWords` below excludes only a genuine same-Word duplicate (a
   * Word's own base-lemma WordForm spells identically to its own exact
   * lookupAll() match, and would otherwise appear twice) -- a *different*
   * Word's inflected spelling colliding with this one's exact spelling
   * is exactly the case this function now surfaces both readings for.
   *
   * This is the one choke point both DictionaryProcessor.identifyWord and
   * identifyPhrase call for every span they try (identifyPhrase's own
   * docstring), so this merge covers ordinary single-word identification
   * and every phrase-search span alike without either caller needing its
   * own copy of this logic. An inflected match is real evidence, just
   * weaker than a Word's own canonical spelling, so it's scored below
   * every exact match (inflectedConfidence(), always < every
   * seededConfidence() value) and tagged
   * IdentificationSource.INFLECTED_FORM rather than SEEDED_VOCABULARY,
   * with a reason naming the specific field that matched -- an exact
   * match for the same occurrence still always outranks it once both are
   * merged and sorted below. */
  identifySeeded(context: WordLookupContext): readonly WordIdentifier[] {
    const seededWords = this.dictionary.lookupAll(context.normalisedText);
    const exactCandidates: WordIdentifier[] = seededWords.map((word) => ({
      word,
      partOfSpeech: word.partOfSpeech,
      source: IdentificationSource.SEEDED_VOCABULARY,
      confidence: this.seededConfidence(word.partOfSpeech, context),
      reason: this.seededReason(word.partOfSpeech, context),
    }));

    const exactWords = new Set(seededWords);
    const formMatches: readonly { word: Word; field: WordFormType }[] =
      this.wordForms?.lookupByText(context.normalisedText).map(({ word, form }) => ({ word, field: form.formType })) ?? [];
    const inflectedCandidates: WordIdentifier[] = formMatches
      .filter(({ word }) => !exactWords.has(word))
      .map(({ word, field }) => ({
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
    // ES2019). Exact candidates listed first, so an exact/inflected tie
    // (never possible today, inflectedConfidence() is always strictly
    // lower, but not relied on silently) still prefers the exact one.
    const candidates: WordIdentifier[] = [...exactCandidates, ...inflectedCandidates];
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

  private inflectedReason(word: Word, field: WordFormType, context: WordLookupContext): string {
    return `Matched "${context.rawText}" via this Word's own "${wordFormTypeLabel(field)}" form, not its base lexical form ("${word.text}").`;
  }
}
