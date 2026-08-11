import type { PartOfSpeech } from "../../vocabulary/data/part_of_speech";
import type { ClauseType } from "./clause_type";
import type { PhraseType } from "./phrase_type";
import type { ReadingError } from "./reading_error";
import type { SequencingObligation } from "./sequencing_obligation";
import type { ValidationOutcome } from "./validation_outcome";

/** One candidate reading of a token span: a part-of-speech assignment
 * plus the phrase/clause spans it implies -- deliberately NOT a
 * materialised Phrase/Clause tree. Alternatives are retained (spec 15,
 * 24) as these lightweight records so that keeping several credible
 * interpretations around doesn't allocate several trees' worth of
 * LinguisticSystemPropertyTensor rows; only the one accepted
 * Interpretation is ever materialised (GraphProcessor.buildSentenceFromReading).
 *
 * Ported from linguistics/data/interpretation.py. */
export interface Interpretation {
  // One entry per token in the span, index-aligned with the
  // TokenReading sequence this interpretation was read from.
  selectedPartsOfSpeech: readonly PartOfSpeech[];
  // Word.entryId.value per token, same index alignment -- undefined for
  // an unresolved token, so a materialiser can re-find the exact seeded
  // sense without re-running identifyWord.
  selectedEntryIds: readonly (string | undefined)[];
  // (type, start index, end index exclusive) per phrase this
  // interpretation implies.
  phraseSpans: readonly (readonly [PhraseType, number, number])[];
  clauseSpans: readonly (readonly [ClauseType, number, number])[];
  openObligations: readonly SequencingObligation[];
  validation: ValidationOutcome;
  confidence: number;
  // ReadingScorer's own lexicographic ranking key -- kept on the record
  // (not just used transiently to sort) so a ReadingError or a report
  // can explain *why* one interpretation outranked another.
  rankKey: readonly (number | string)[];
  errors: readonly ReadingError[];
}
