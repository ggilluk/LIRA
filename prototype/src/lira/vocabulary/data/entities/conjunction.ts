/**
 * Represents a Conjunction -- Word's own CONJUNCTION-specific
 * subtype, narrowing `partOfSpeech` at the type level.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import { PartOfSpeech } from "../enums/part_of_speech";
import { ConjunctionType } from "../enums/conjunction_type";
import type { Word } from "./word";

export interface Conjunction extends Word {
  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech.CONJUNCTION;

  /** Whether this Conjunction links two or more equal constituents
   * (COORDINATING) or introduces a clause dependent on a main clause
   * (SUBORDINATING) -- data/enums/conjunction_type.ts's own docstring. */
  conjunctionType: ConjunctionType;
}
