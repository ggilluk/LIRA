/**
 * Represents a lexical Word within the vocabulary -- one lexical form
 * in one language and one grammatical category.
 *
 * A Word may stand for a lexical entry (a dictionary-level type) or
 * for one occurrence of that entry within a sentence (a token); both
 * uses share this same shape.
 *
 * Invariants:
 * - `uuid` uniquely identifies this Word within its own Domain.
 * - `entryId` identifies the same underlying vocabulary entry across
 *   every Domain that holds a copy of it.
 * - A Word carries no system-tensor properties of its own -- those
 *   belong to a claimed LexicalRelationship between two Words.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import type { Code, Identifier, Number_, Text } from "../../../value_objects";
import type { LinguisticUnit } from "../../../linguistics/data/linguistic_unit";
import type { EditorialLabel } from "../enums/editorial_label";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { Pronunciation } from "../pronunciation";
import type { RegisterCode } from "../enums/register_code";
import type { SourceReference } from "../source_reference";

export interface Word extends LinguisticUnit {

  // ── Identity ─────────────────────────────────────────────

  /** Unique identifier of this Word within its own Domain. */
  uuid: Identifier;

  /**
   * Identifier of the underlying vocabulary entry this Word
   * represents, stable across every Domain that holds a copy of it.
   */
  entryId: Identifier;


  // ── Classification ───────────────────────────────────────

  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech;


  // ── Data Attributes ──────────────────────────────────────

  /**
   * Spelling of this Word as it is conventionally written.
   *
   * Carries this Word's own language, script, and version as its own
   * `languageCode`/`scriptCode`/`version` attributes (`Text`'s own
   * docstring, value_objects/data/text.ts) rather than as separate
   * fields here.
   */
  lexicalForm?: Text;

  /** Case- and diacritic-normalised form of `lexicalForm`. */
  normalisedForm?: Text;

  /**
   * The base lexical form this Word is an inflected spelling of.
   *
   * Undefined when this Word's own spelling already is its canonical
   * form.
   */
  baseLemmaCanonicalForm?: Text;

  /** Every recorded pronunciation of this Word. */
  pronunciations: readonly Pronunciation[];

  /** This Word's own spelling broken into syllables. */
  syllableRepresentation?: Text;

  /** Number of syllables in this Word's own pronunciation. */
  syllableCount?: Number_;

  /** Stress pattern of this Word's own pronunciation. */
  stressPattern?: Text;

  /** Short gloss summarising this Word's own primary sense. */
  gloss?: Text;

  /** Definition of this Word's own primary sense. */
  definition?: Text;

  /** Usage notes for this Word. */
  usageNotes: readonly Text[];

  /** Registers of use this Word is associated with. */
  registerCodes: readonly RegisterCode[];

  /** Dialects this Word is associated with. */
  dialectCodes: readonly Code[];

  /** Frequency value of this Word's own usage. */
  frequencyValue?: Number_;

  /** Scale the frequency value above is measured on. */
  frequencyScale?: Code;

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
   * Identifier of this Word's own primary Sense's Princeton WordNet
   * synset.
   *
   * Undefined when this Word has no Princeton WordNet synset of its
   * own.
   */
  synsetId?: Identifier;

  /** Identifiers of every Sense this Word lexicalizes. */
  senseIds: readonly Identifier[];

  /**
   * Identifiers of the closed-class Words this contracted form
   * spells (e.g. "don't" spells "do" and "not").
   *
   * Empty when this Word is not itself a contraction.
   */
  contractionOf: readonly Identifier[];

  /** Identifiers of the WordForms belonging to this Word. */
  wordFormIds: readonly Identifier[];


  // ── System Metadata ──────────────────────────────────────

  /**
   * Indicates whether this Word's own meaning and part of speech
   * have finished being populated from an external source.
   */
  isFullyHydrated: boolean;
}
