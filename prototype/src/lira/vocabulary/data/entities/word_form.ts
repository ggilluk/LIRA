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
import type { WordFormField } from "../enums/word_forms_enum";

export interface WordForm {

  // ── Identity ─────────────────────────────────────────────

  /**
   * Identifier of the underlying WordForm entry this record
   * represents.
   *
   * `entryId.value` is stable across every Domain that holds a copy
   * of this WordForm; `entryId.uuid` is this WordForm's own unique
   * identifier within its own Domain, freshly regenerated every time
   * this WordForm is copied into another Domain.
   */
  entryId: Identifier;


  // ── Classification ───────────────────────────────────────

  /**
   * Which `*_Form` field this WordForm stands for -- the Word Form to
   * Part of Speech Matrix's own single agreed list
   * (data/enums/word_forms_enum.ts, data/matrices/pos_vs_wordform_matrice.ts).
   */
  field: WordFormField;


  // ── Data Attributes ──────────────────────────────────────

  /** Spelling of this WordForm as it is conventionally written. */
  text: Text;

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
   *
   * Carries no `synsetId` of its own for the same reason Sense doesn't
   * (Sense's own docstring): WordNet's own synset identifier is an
   * externally-defined attribute, mapped onto `senseIds[0]` via
   * `WordForms.synsetIdOf(word)` instead (data/word_forms.ts).
   */
  senseIds: readonly Identifier[];

  /**
   * Identifiers of the closed-class Words this contracted spelling
   * spells (e.g. "don't" spells "do" and "not").
   *
   * Empty when this WordForm is not itself a contraction.
   */
  contractionOf: readonly Identifier[];
}
