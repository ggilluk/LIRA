/**
 * Represents an Adjective -- Word's own ADJECTIVE-specific subtype.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape, including why the
 * Positive/Comparative/Superlative Degree Form fields the Word Form
 * to Part of Speech Matrix names for ADJECTIVE are not declared here
 * (they live as WordForm records instead, reached via
 * `Word.wordFormIds`), and where an Adjective's own syntactic
 * position restriction is recorded (as per-Sense metadata, not a
 * field here).
 */

import type { Identifier } from "../../../value_objects";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Adjective extends Word {

  // ── Classification ───────────────────────────────────────

  partOfSpeech: PartOfSpeech.ADJECTIVE;


  // ── References ───────────────────────────────────────────

  /**
   * Identifier of the Noun this Adjective nominalizes into (e.g.
   * "happiness" from "happy").
   *
   * Undefined when this Adjective has no such Noun.
   */
  isNominalised?: Identifier;

  /** Indicates whether `isNominalised` is set. */
  isNominalisedIndicator: boolean;

  /**
   * Identifier of the Adverb this Adjective adverbialises into (e.g.
   * "quickly" from "quick").
   *
   * Undefined when this Adjective has no such Adverb.
   */
  isAdverbialised?: Identifier;

  /** Indicates whether `isAdverbialised` is set. */
  isAdverbialisedIndicator: boolean;

  /**
   * Identifier of the Verb this Adjective adjectivises from (e.g.
   * "interesting" from "interest").
   *
   * Undefined when this Adjective is not adjectivised from a Verb.
   */
  isDerivedFromVerb?: Identifier;

  /** Indicates whether `isDerivedFromVerb` is set. */
  isDerivedFromVerbIndicator: boolean;
}
