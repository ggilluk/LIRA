import type { Code, Text } from "../../value_objects";
import type { PartOfSpeech } from "./part_of_speech";
import type { SourceReference } from "./source_reference";

/** One externally-sourced grammatical-category candidate for a lexical
 * form, parsed from an external dictionary API response
 * (ExternalDictionaryAdapter) before it becomes a Word. Field set
 * mirrors what Word already supports (definition, gloss, usageNotes,
 * sourceReferences, ...) rather than introducing an unrelated schema.
 *
 * Ported from vocabulary/data/external_word_candidate.py. */
export interface ExternalWordCandidate {
  text: string;
  lexicalForm: string;
  normalisedForm: string;
  languageCode: Code;
  partOfSpeech: PartOfSpeech;

  definition?: Text;
  gloss?: Text;
  usageNotes: readonly Text[];

  domainConcept?: Text;
  domainRelevance: number;
  sourceConfidence: number;

  sourceReferences: readonly SourceReference[];
}

/** The domain hint ranks candidates the external source already
 * supports; it never manufactures confidence on its own --
 * sourceConfidence always carries the majority weight. */
export function combinedConfidence(candidate: ExternalWordCandidate): number {
  return Math.min(1.0, candidate.sourceConfidence * 0.65 + candidate.domainRelevance * 0.35);
}
