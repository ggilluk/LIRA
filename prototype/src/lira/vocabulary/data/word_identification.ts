import type { PartOfSpeech } from "./part_of_speech";
import type { Word } from "./word";

/** Represents one candidate resolution of a raw token occurrence to a
 * grammatical category -- never a guess. DictionaryProcessor.identifyWord
 * returns zero or more of these; zero means the occurrence has no
 * resolved sense yet (external hydration has been queued, not that the
 * occurrence is a NOUN by default).
 *
 * Ported from vocabulary/data/word_identification.py. */
export enum IdentificationSource {
  SEEDED_VOCABULARY = "seeded_vocabulary",
  ORTHOGRAPHIC_EVIDENCE = "orthographic_evidence",
  EXTERNAL_REFERENCE = "external_reference",
}

export interface WordIdentification {
  word?: Word;
  partOfSpeech: PartOfSpeech;
  source: IdentificationSource;
  confidence: number;
  reason: string;
}
