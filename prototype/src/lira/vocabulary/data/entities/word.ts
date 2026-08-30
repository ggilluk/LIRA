/**
 * Represents a lexical Word within the vocabulary -- one lexical form
 * in one language and one grammatical category.
 *
 * A Word may stand for a lexical entry (a dictionary-level type) or
 * for one occurrence of that entry within a sentence (a token); both
 * uses share this same shape.
 *
 * Invariants:
 * - `entryId.uuid` uniquely identifies this Word within its own
 *   Domain.
 * - `entryId.value` identifies the same underlying vocabulary entry
 *   across every Domain that holds a copy of it.
 * - A Word carries no system-tensor properties of its own -- those
 *   belong to a claimed LexicalRelationship between two Words.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import type { Identifier, Text } from "../../../value_objects";
import type { LinguisticUnit } from "../../../linguistics/data/linguistic_unit";
import type { EditorialLabel } from "../enums/editorial_label";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { RegisterCode } from "../enums/register_code";
import type { SourceReference } from "../source_reference";

export interface Word extends LinguisticUnit {

  // ── Identity ─────────────────────────────────────────────

  /**
   * Identifier of the underlying vocabulary entry this Word
   * represents.
   *
   * `entryId.value` is stable across every Domain that holds a copy
   * of this Word; `entryId.uuid` is this Word's own unique identifier
   * within its own Domain, freshly regenerated every time this Word
   * is copied into another Domain.
   */
  entryId: Identifier;


  // ── Classification ───────────────────────────────────────

  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech;


  // ── Data Attributes ──────────────────────────────────────

  /** Short gloss summarising this Word's own primary sense. */
  gloss?: Text;

  /** Usage notes for this Word. */
  usageNotes: readonly Text[];

  /** Registers of use this Word is associated with. */
  registerCodes: readonly RegisterCode[];

  /** Etymology of this Word. */
  etymologyText?: Text;

  /** Text describing this Word's own first recorded use. */
  firstRecordedUse?: Text;

  /** Editorial labels applying to this Word. */
  editorialLabels: readonly EditorialLabel[];

  /** Sources this Word's own record was compiled from. */
  sourceReferences: readonly SourceReference[];

  /** Indicates whether this Word belongs to the Common Vocabulary. */
  isCommon: boolean;

  /**
   * Subdomain distinguishing this Word's own sense from another sense
   * sharing the same lexical form and part of speech.
   *
   * Undefined when this Word's own sense needs no such distinction.
   */
  domainTag?: Text;

  /**
   * Every additional topic domain this Word's own sense belongs to,
   * beyond the one named by `domainTag`.
   *
   * Empty when this Word's own sense belongs to at most one topic
   * domain.
   */
  relatedDomainTags: readonly Text[];


  // ── References ───────────────────────────────────────────

  /**
   * Identifiers of the WordForms belonging to this Word.
   *
   * Always includes this Word's own base-lemma WordForm -- its
   * lexical/normalised spelling, pronunciation, syllable, and frequency
   * attributes live there now, not as separate fields here (`WordForm`'s
   * own docstring, data/entities/word_form.ts). So do `synsetId`/`senseIds`/
   * `contractionOf` -- WordForms.baseLemmaFormOf(word) is the read side
   * for all three now, not a scalar field on Word. A Word carries no
   * `dialectCodes` of its own either, for the identical reason: a
   * dialect is a fact about one specific spelling, so it lives on that
   * spelling's own `Text.dialectCode` (`WordForms.baseLemmaFormOf(word)?.text.dialectCode`),
   * value_objects/data/text.ts's own docstring on why Text itself
   * carries this.
   */
  wordFormIds: readonly Identifier[];


  // ── System Metadata ──────────────────────────────────────

  /**
   * Indicates whether this Word's own meaning and part of speech
   * have finished being populated from an external source.
   */
  isFullyHydrated: boolean;
}
