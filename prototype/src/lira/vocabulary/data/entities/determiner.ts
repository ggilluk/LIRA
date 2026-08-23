/**
 * Represents a Determiner -- Word's own DETERMINER-specific subtype.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape, including why its own
 * Word Form to Part of Speech Matrix fields (Singular/Plural Number
 * Form, Possessive Case Form) are not declared here.
 */

import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Determiner extends Word {
  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech.DETERMINER;
}
