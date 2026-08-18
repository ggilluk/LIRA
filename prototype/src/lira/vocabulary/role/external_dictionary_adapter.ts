import type { ExternalWordCandidate } from "../data/external_word_candidate";
import { combinedConfidence } from "../data/external_word_candidate";
import { PartOfSpeech } from "../data/enums/part_of_speech";
import type { SourceReference } from "../data/source_reference";
import type { WordLookupContext } from "../data/word_lookup_context";

/** Translates an external dictionary API response into LIRA vocabulary
 * candidates, insulating core engine data structures against external
 * JSON schema breakage. Returns every grammatical category the
 * external source actually supports for the surface form -- never just
 * the first meaning, and never a fallback NOUN guess when the source
 * gives no usable evidence: an entry this adapter can't confidently
 * classify against a real PartOfSpeech member is dropped, not
 * defaulted.
 *
 * Ported from vocabulary/role/external_dictionary_adapter.py. */

const EXTERNAL_POS_NAMES: Record<string, PartOfSpeech> = {
  noun: PartOfSpeech.NOUN,
  verb: PartOfSpeech.VERB,
  adjective: PartOfSpeech.ADJECTIVE,
  adverb: PartOfSpeech.ADVERB,
  pronoun: PartOfSpeech.PRONOUN,
  determiner: PartOfSpeech.DETERMINER,
  preposition: PartOfSpeech.PREPOSITION,
  conjunction: PartOfSpeech.CONJUNCTION,
  interjection: PartOfSpeech.INTERJECTION,
  numeral: PartOfSpeech.NUMERAL,
  particle: PartOfSpeech.PARTICLE,
  auxiliary: PartOfSpeech.AUXILIARY,
  "proper noun": PartOfSpeech.PROPER_NOUN,
  symbol: PartOfSpeech.SYMBOL,
};

interface ApiDefinition {
  definition?: unknown;
  example?: unknown;
}

interface ApiMeaning {
  partOfSpeech?: unknown;
  definitions?: unknown;
}

interface ApiEntry {
  word?: unknown;
  meanings?: unknown;
}

export class ExternalDictionaryAdapter {
  static parseApiPayload(payload: unknown, context: WordLookupContext, sourceUri: string): readonly ExternalWordCandidate[] {
    if (!Array.isArray(payload)) return [];

    const candidates: ExternalWordCandidate[] = [];

    for (const entry of payload as unknown[]) {
      if (typeof entry !== "object" || entry === null) continue;
      const entryRecord = entry as ApiEntry;
      const sourceWord = String(entryRecord.word ?? context.rawText).trim();

      const meanings = entryRecord.meanings;
      if (!Array.isArray(meanings)) continue;

      for (const meaning of meanings as unknown[]) {
        const candidate = this.parseMeaning(meaning, sourceWord, context, sourceUri);
        if (candidate !== undefined) candidates.push(candidate);
      }
    }

    return this.deduplicate(candidates);
  }

  private static parseMeaning(
    meaning: unknown,
    sourceWord: string,
    context: WordLookupContext,
    sourceUri: string,
  ): ExternalWordCandidate | undefined {
    if (typeof meaning !== "object" || meaning === null) return undefined;
    const meaningRecord = meaning as ApiMeaning;

    const rawPartOfSpeech = String(meaningRecord.partOfSpeech ?? "").trim().toLowerCase();
    const partOfSpeech = EXTERNAL_POS_NAMES[rawPartOfSpeech];
    if (partOfSpeech === undefined) {
      // No fallback NOUN here -- an entry this adapter can't map to a
      // real PartOfSpeech member is dropped, not guessed at.
      return undefined;
    }

    const rawDefinitions = meaningRecord.definitions;
    const definitions: ApiDefinition[] = Array.isArray(rawDefinitions) ? (rawDefinitions as ApiDefinition[]) : [];

    const firstDefinition = definitions.find(
      (definition) => typeof definition === "object" && definition !== null && definition.definition,
    );
    const definitionText = firstDefinition?.definition !== undefined
      ? { value: String(firstDefinition.definition) }
      : undefined;

    const usageNotes = definitions
      .filter((definition) => typeof definition === "object" && definition !== null && definition.example)
      .map((definition) => ({ value: String(definition.example) }));

    const domainRelevance = this.calculateDomainRelevance(
      definitionText?.value ?? "",
      context.domainName,
      [...context.precedingWords, ...context.followingWords],
    );

    const sourceReference: SourceReference = {
      sourceName: { value: "Free Dictionary API" },
      externalIdentifier: { value: `${sourceWord}:${rawPartOfSpeech}` },
      referenceUri: { value: sourceUri },
    };

    return {
      text: context.rawText,
      lexicalForm: context.normalisedText,
      normalisedForm: context.normalisedText,
      languageCode: { value: "en" },
      partOfSpeech,
      definition: definitionText,
      usageNotes,
      domainRelevance,
      sourceConfidence: 0.85,
      sourceReferences: [sourceReference],
    };
  }

  /** Lowercased word tokens, stripped of surrounding punctuation (a
   * definition's final word carries a trailing period more often than
   * not) and split on hyphens, so "gas-fired" contributes both "gas"
   * and "fired" the same way a compound domain name does. */
  private static wordTerms(text: string): Set<string> {
    const matches = text.toLowerCase().replace(/-/g, " ").match(/[^\W_]+/g) ?? [];
    return new Set(matches);
  }

  /** Simple deterministic ranking only. The domain hint ranks
   * externally returned dictionary senses (e.g. "plant" + "Energy
   * Power Generation" should rank the power-station sense above the
   * biological one); it never invents a new definition or POS, and
   * every sense the source actually supports is still returned by
   * parseApiPayload -- ranking, not filtering. */
  private static calculateDomainRelevance(definition: string, domainName: string, surroundingWords: readonly string[]): number {
    const definitionTerms = this.wordTerms(definition);
    const domainTerms = this.wordTerms(domainName);
    const contextTerms = new Set(surroundingWords.flatMap((word) => [...this.wordTerms(word)]));

    const domainOverlap = [...definitionTerms].filter((term) => domainTerms.has(term)).length;
    const contextOverlap = [...definitionTerms].filter((term) => contextTerms.has(term)).length;

    const score = 0.25 + Math.min(0.5, domainOverlap * 0.15) + Math.min(0.25, contextOverlap * 0.1);

    return Math.min(1.0, score);
  }

  /** One candidate per grammatical category -- LIRA models different
   * POS as separate Word records, but not a same-form/same-POS meaning
   * conflict (that needs explicit sense handling, see
   * DictionaryProcessor.registerConflictingSense), so within one
   * external POS category only the highest-ranked candidate
   * survives. */
  private static deduplicate(candidates: readonly ExternalWordCandidate[]): readonly ExternalWordCandidate[] {
    const bestByCategory = new Map<PartOfSpeech, ExternalWordCandidate>();

    for (const candidate of candidates) {
      const existing = bestByCategory.get(candidate.partOfSpeech);
      if (existing === undefined || combinedConfidence(candidate) > combinedConfidence(existing)) {
        bestByCategory.set(candidate.partOfSpeech, candidate);
      }
    }

    return [...bestByCategory.values()].sort((a, b) => combinedConfidence(b) - combinedConfidence(a));
  }
}
