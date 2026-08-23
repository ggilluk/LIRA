/**
 * Represents a Conjunction -- Word's own CONJUNCTION-specific
 * subtype, narrowing `partOfSpeech` at the type level. Carries no
 * field of its own beyond `partOfSpeech`.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Conjunction extends Word {
  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech.CONJUNCTION;
}
