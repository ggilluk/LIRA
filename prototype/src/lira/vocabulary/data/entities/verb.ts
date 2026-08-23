/**
 * Represents a Verb -- Word's own VERB-specific subtype.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape, including why the
 * Present/Past/Third-Person-Singular-Present/Present-Participle/
 * Past-Participle/Bare-Infinitive Form fields the Word Form to Part
 * of Speech Matrix names for VERB are not declared here (they live
 * as WordForm records instead, reached via `Word.wordFormIds`), and
 * where a Verb's own applicable verb frames are recorded (as
 * per-Sense metadata, not a field here).
 */

import type { Identifier } from "../../../value_objects";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Verb extends Word {

  // ── Classification ───────────────────────────────────────

  partOfSpeech: PartOfSpeech.VERB;


  // ── References ───────────────────────────────────────────

  /**
   * Identifier of the Noun this Verb nominalizes into (e.g.
   * "decision" from "decide").
   *
   * Undefined when this Verb has no such Noun.
   */
  isNominalised?: Identifier;

  /** Indicates whether `isNominalised` is set. */
  isNominalisedIndicator: boolean;

  /**
   * Identifier of the Adjective this Verb adjectivises into (e.g.
   * "interesting" from "interest").
   *
   * Undefined when this Verb has no such Adjective.
   */
  isAdjectivised?: Identifier;

  /** Indicates whether `isAdjectivised` is set. */
  isAdjectivisedIndicator: boolean;
}
