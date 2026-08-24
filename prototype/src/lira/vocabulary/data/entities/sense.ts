/**
 * Represents one shared meaning that one or more Words or Phrases
 * lexicalize -- the first-class counterpart to what a Princeton
 * WordNet synset already names.
 *
 * A Word or Phrase that lexicalizes this Sense references it by
 * identifier rather than duplicating its data.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import type { Identifier, Number_, Text } from "../../../value_objects";
import type { HolonymRootWord } from "../enums/holonym_root_word";
import type { HypernymRootWord } from "../enums/hypernym_root_word";
import type { InterrogativeRootWord } from "../enums/interrogative_root_word";
import type { SourceReference } from "../source_reference";
import type { VectorPrimitiveRootWord } from "../enums/vector_primitive_root_word";

export interface Sense {

  // ── Identity ─────────────────────────────────────────────

  /**
   * Identifier of the underlying Sense entry this record represents.
   *
   * `entryId.value` is stable across every Domain that holds a copy
   * of this Sense; `entryId.uuid` is this Sense's own unique
   * identifier within its own Domain, freshly regenerated every time
   * this Sense is copied into another Domain.
   */
  entryId: Identifier;


  // ── Classification ───────────────────────────────────────

  /** Indicates whether this Sense names the answer to an interrogative in the Interrogative/Hypernym/Holonym/Vector-Primitive root word table. */
  isRootWord: boolean;

  /**
   * Interrogative this Sense answers, in the Interrogative/Hypernym/
   * Holonym/Vector-Primitive root word table.
   *
   * Undefined unless `isRootWord` is true and this is that
   * interrogative's own column.
   */
  interrogativeRootWord?: InterrogativeRootWord;

  /**
   * Hypernym column this Sense instantiates, in the Interrogative/
   * Hypernym/Holonym/Vector-Primitive root word table.
   *
   * Undefined unless `isRootWord` is true and this is that
   * hypernym's own column.
   */
  hypernymRootWord?: HypernymRootWord;

  /**
   * Holonym column this Sense instantiates, in the Interrogative/
   * Hypernym/Holonym/Vector-Primitive root word table.
   *
   * Undefined unless `isRootWord` is true and this is that
   * holonym's own column.
   */
  holonymRootWord?: HolonymRootWord;

  /**
   * Vector/primitive column this Sense instantiates, in the
   * Interrogative/Hypernym/Holonym/Vector-Primitive root word table.
   *
   * Undefined unless `isRootWord` is true and this is that
   * primitive's own column.
   */
  vectorPrimitiveRootWord?: VectorPrimitiveRootWord;


  // ── Data Attributes ──────────────────────────────────────

  /** Short gloss summarising this Sense. */
  gloss?: Text;

  /** Definition of this Sense. */
  definition?: Text;

  /** Usage notes for this Sense. */
  usageNotes: readonly Text[];

  /**
   * How often this Sense was tagged as the intended meaning in
   * Princeton WordNet's semantic concordance corpus (SemCor).
   *
   * Undefined when this Sense did not come from WordNet; 0 when
   * WordNet's own concordance never tagged this Sense at all.
   */
  senseFrequency?: number;

  /**
   * Subdomain distinguishing this Sense from another sense sharing
   * the same lexical form and part of speech.
   *
   * Undefined when this Sense needs no such distinction.
   */
  domainTag?: Text;

  /**
   * Every additional topic domain this Sense belongs to, beyond the
   * one named by `domainTag`.
   *
   * Empty when this Sense belongs to at most one topic domain.
   */
  relatedDomainTags: readonly Text[];

  /**
   * Princeton WordNet's own lexicographer-file category naming this
   * Sense's meaning (e.g. "noun.artifact").
   *
   * Undefined when this Sense did not come from WordNet.
   */
  senseDomainTag?: Text;

  /** Sources this Sense's own record was compiled from. */
  sourceReferences: readonly SourceReference[];

  /** Indicates whether this Sense belongs to the Common Vocabulary. */
  isCommon: boolean;

  /**
   * This Sense's own position on the Pleasure axis of the PAD
   * (Pleasure-Arousal-Dominance) affective model.
   *
   * Undefined when no PAD value has been assigned to this Sense.
   */
  seededPleasureDispleasureWeight?: Number_;

  /**
   * This Sense's own position on the Arousal axis of the PAD
   * affective model.
   *
   * Undefined when no PAD value has been assigned to this Sense.
   */
  seededArousalNonArousalWeight?: Number_;

  /**
   * This Sense's own position on the Dominance axis of the PAD
   * affective model.
   *
   * Undefined when no PAD value has been assigned to this Sense.
   */
  seededDominanceSubmissiveWeight?: Number_;


  // ── References ───────────────────────────────────────────

  /**
   * Identifier of the Princeton WordNet synset this Sense
   * corresponds to.
   *
   * Undefined when this Sense did not come from WordNet.
   */
  synsetId?: Identifier;
}
