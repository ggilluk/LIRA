import type { PartOfSpeech } from "../../vocabulary/data/part_of_speech";
import type { LinguisticScope } from "./linguistic_scope";
import type { LinguisticUnitKind } from "./linguistic_unit_kind";
import type { ObligationKind } from "./sequencing_obligation";

/** All sixteen kinds spec 21 requires, defined from the outset so the
 * values are stable across phases -- the four marked Phase 2 below are
 * simply never emitted until their constructs exist.
 *
 * Ported from linguistics/data/reading_error.py. */
export enum ReadingErrorKind {
  UNKNOWN_VOCABULARY_WORD = 0,
  NO_SEEDED_PART_OF_SPEECH = 1,
  NO_VALID_PHRASE_SEQUENCE = 2,
  MISSING_PHRASE_HEAD = 3,
  INCOMPLETE_DETERMINER_SEQUENCE = 4,
  PREPOSITION_MISSING_OBJECT = 5,
  INFINITIVE_MISSING_VERB = 6,
  NO_VALID_CLAUSE_SEQUENCE = 7,
  MISSING_PREDICATE = 8,
  MISSING_FINITE_VERB = 9,
  INCOMPLETE_COORDINATION = 10,
  UNCLOSED_RELATIVE_CLAUSE = 11, // Phase 2 -- no relative clauses exist yet to leave unclosed.
  INVALID_PUNCTUATION_SEQUENCE = 12,
  UNCLOSED_SCOPE = 13, // This phase: phrase scopes only. Quotation/parenthetical scopes are Phase 2.
  NO_VALID_SENTENCE_INTERPRETATION = 14,
  MULTIPLE_EQUALLY_RANKED_INTERPRETATIONS = 15,
}

/** One structured error (spec 21: "each error must identify where
 * applicable" the fields below). wordEntryId is a reference
 * (Word.entryId.value), never a copy of vocabulary data -- consistent
 * with Phrase/Clause/Sentence referencing Vocabulary Words rather than
 * duplicating their fields (spec 4, 12.2). */
export interface ReadingError {
  kind: ReadingErrorKind;
  level: LinguisticUnitKind;
  message: string;
  tokenIndex?: number;
  tokenText?: string;
  wordEntryId?: string;
  seededCandidatePartsOfSpeech: readonly PartOfSpeech[];
  currentState?: PartOfSpeech;
  expectedStates: readonly PartOfSpeech[];
  openScope?: LinguisticScope;
  unfinishedObligation?: ObligationKind;
}

export function createReadingError(
  init: Pick<ReadingError, "kind" | "level" | "message"> & Partial<ReadingError>,
): ReadingError {
  return {
    seededCandidatePartsOfSpeech: [],
    expectedStates: [],
    ...init,
  };
}
