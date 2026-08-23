/**
 * Represents an Auxiliary -- Word's own AUXILIARY-specific subtype.
 * One Word per base lemma (be, have, do, can, may, shall, will,
 * must, ought, need, dare), not one per surface spelling -- every
 * distinguishing spelling (e.g. "was", "were") lives on a WordForm
 * record reached via this Word's own `wordFormIds` instead.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Auxiliary extends Word {
  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech.AUXILIARY;
}
