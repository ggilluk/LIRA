/**
 * Represents one inflected spelling of one Word.
 *
 * A WordForm gives a single spelling its own identity, addressable via
 * `Word.wordFormIds` rather than inlined as a scalar field on Word --
 * Sense's own exact counterpart one level down (a Sense gives a shared
 * meaning its own identity; a WordForm does the same for one specific
 * spelling of a lemma).
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import type { Code, Identifier, Number_, Text } from "../../../value_objects";
import type { Pronunciation } from "../pronunciation";

export interface WordForm {

  // ── Identity ─────────────────────────────────────────────

  /** Unique identifier of this WordForm within its own Domain. */
  uuid: Identifier;

  /**
   * Identifier of the underlying WordForm entry this record
   * represents, stable across every Domain that holds a copy of it.
   */
  entryId: Identifier;


  // ── Classification ───────────────────────────────────────

  /**
   * Name of the `*_Form` field this WordForm stands for (e.g.
   * "presentTenseInstanceForm", "baseLemmaCanonicalForm").
   */
  field: string;


  // ── Data Attributes ──────────────────────────────────────

  /** Spelling of this WordForm as it is conventionally written. */
  text: Text;

  /** Every recorded pronunciation of this spelling. */
  pronunciations: readonly Pronunciation[];

  /**
   * This spelling's own syllable breakdown.
   *
   * Undefined when a syllable breakdown has not been curated for this
   * spelling.
   */
  syllableRepresentation?: Text;

  /**
   * This spelling's own syllable count.
   *
   * Undefined when a syllable count has not been curated for this
   * spelling.
   */
  syllableCount?: Number_;

  /**
   * This spelling's own stress pattern.
   *
   * Undefined when a stress pattern has not been curated for this
   * spelling.
   */
  stressPattern?: Text;

  /**
   * This spelling's own usage frequency value.
   *
   * Undefined when a frequency value has not been curated for this
   * spelling.
   */
  frequencyValue?: Number_;

  /**
   * Scale the frequency named by `frequencyValue` is expressed on.
   *
   * Undefined when `frequencyValue` is undefined.
   */
  frequencyScale?: Code;


  // ── References ───────────────────────────────────────────

  /**
   * Identifiers of the Senses this spelling lexicalizes.
   *
   * More than one entry means this one spelling carries more than one
   * distinct meaning.
   */
  senseIds: readonly Identifier[];

  /**
   * Identifier of the Princeton WordNet synset naming this WordForm's
   * own primary (`senseIds[0]`) Sense.
   *
   * Undefined when this WordForm has no Princeton WordNet synset of
   * its own.
   */
  synsetId?: Identifier;

  /**
   * Identifiers of the closed-class Words this contracted spelling
   * spells (e.g. "don't" spells "do" and "not").
   *
   * Empty when this WordForm is not itself a contraction.
   */
  contractionOf: readonly Identifier[];
}
