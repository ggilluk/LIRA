import { PartOfSpeech } from "../../vocabulary/data/part_of_speech";
import type { WordIdentification } from "../../vocabulary/data/word_identification";

/** One raw token occurrence together with EVERY seeded candidate
 * DictionaryProcessor.identifyWord returned for it -- the read path's
 * replacement for GraphProcessor's own collapse to candidates[0].
 * TokenReading holds no tensor row of its own: the sequencing search
 * explores TokenReadings freely (discarding most of them), and only the
 * one accepted interpretation is ever materialised into tensor-backed
 * Word occurrences (GraphProcessor.materialiseToken) -- allocating a
 * row per candidate here would leave tensor rows behind for
 * interpretations nothing kept.
 *
 * Ported from linguistics/data/token_reading.py. Python's @property/
 * method pairs become free functions of the same name taking `reading`
 * as their first argument, the same pattern word.ts's derived
 * properties already use. */
export interface TokenReading {
  text: string;
  tokenIndex: number;
  sentenceIndex: number;
  isSentenceStart: boolean;
  // Untouched, in identifyWord's own rank order (PartOfSpeechIdentifier's
  // stable sort by occurrence-level orthographic confidence) --
  // sequencing never re-derives this ranking, only chooses among what
  // it already contains.
  candidates: readonly WordIdentification[];
}

export function createTokenReading(
  init: Pick<TokenReading, "text" | "tokenIndex" | "sentenceIndex" | "isSentenceStart"> & Partial<TokenReading>,
): TokenReading {
  return { candidates: [], ...init };
}

/** False means identifyWord found no seeded or previously-hydrated
 * sense -- external hydration has already been queued by Vocabulary (a
 * separate process, spec 7), and this occurrence must not be guessed
 * into any part of speech. */
export function isKnown(reading: TokenReading): boolean {
  return reading.candidates.length > 0;
}

export function isPunctuation(reading: TokenReading): boolean {
  return reading.candidates.some((candidate) => candidate.partOfSpeech === PartOfSpeech.PUNCTUATION);
}

/** Distinct parts of speech among this token's candidates, first-seen
 * order -- deduplicated, since a genuine polyseme (e.g. "sense", two
 * seeded NOUN senses under different domainTags) is one sequencing
 * state, not two identical ones competing with themselves. */
export function candidatePartsOfSpeech(reading: TokenReading): readonly PartOfSpeech[] {
  const seen: PartOfSpeech[] = [];
  for (const candidate of reading.candidates) {
    if (!seen.includes(candidate.partOfSpeech)) seen.push(candidate.partOfSpeech);
  }
  return seen;
}

/** The highest-ranked candidate carrying this part of speech, or
 * undefined if this token was never seeded under it. */
export function identificationFor(reading: TokenReading, partOfSpeech: PartOfSpeech): WordIdentification | undefined {
  return reading.candidates.find((candidate) => candidate.partOfSpeech === partOfSpeech);
}
