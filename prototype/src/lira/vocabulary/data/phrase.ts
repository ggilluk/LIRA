/**
 * Represents a Phrase -- a fixed multi-word lexical item ("in spite of",
 * "toy poodle") that functions as one grammatical unit, the same role a
 * single-word Word plays for one token.
 *
 * Still shaped like Linguistics's LinguisticUnit, the same dual use Word
 * already has: a Vocabulary *type* (a lexical entry) and, via
 * `toSyntheticWord` below, a materialisable Linguistics *token*.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import { identifier, type Code, type Identifier, type Text } from "../../value_objects";
import type { Clause } from "../../linguistics/data/clause";
import type { LinguisticUnit } from "../../linguistics/data/linguistic_unit";
import type { EditorialLabel } from "./enums/editorial_label";
import type { PartOfSpeech } from "./enums/part_of_speech";
import type { ModifierRole } from "./enums/modifier_role";
import type { PhraseType } from "./enums/phrase_type";
import type { RegisterCode } from "./enums/register_code";
import type { SourceReference } from "./source_reference";
import type { Word } from "./entities/word";
import type { WordForms } from "./word_forms";
// Known, approved exception to data/ never importing role/ -- see
// role/word_processor.ts's own docstring: createWord() is Word's own
// base-entity constructor, needed here (toSyntheticWord/phraseAsWord
// below) the same way every POS processor already needs it.
import { createWord } from "../role/word_processor";
import { newUuid } from "./uuid";

export interface Phrase extends LinguisticUnit {

  // ── Identity ─────────────────────────────────────────────

  /**
   * Identifier of the underlying multi-word lexicon entry this Phrase
   * represents.
   *
   * `entryId.value` is stable across every Domain that holds a copy of
   * this Phrase; `entryId.uuid` is this Phrase's own unique identifier
   * within its own Domain, freshly regenerated every time this Phrase
   * is copied into another Domain.
   */
  entryId: Identifier;


  // ── Classification ───────────────────────────────────────

  /** Grammatical part of speech under which this Phrase is defined. */
  partOfSpeech: PartOfSpeech;

  /**
   * The grammatical shape this Phrase's own words take -- noun phrase,
   * verb phrase, etc.
   *
   * Undefined for a Common Vocabulary Cache closed-class Phrase.
   */
  phraseType?: PhraseType;


  // ── Data Attributes ──────────────────────────────────────

  /** Version of this Phrase's own record. */
  version: Text;

  /** Language this Phrase is defined in. */
  languageCode: Code;

  /** This Phrase's own canonical written form. */
  lexicalForm?: Text;

  /** This Phrase's own normalised (lower-cased) written form. */
  normalisedForm?: Text;

  /** Short gloss summarising this Phrase's own primary sense. */
  gloss?: Text;

  /** Definition of this Phrase's own primary sense. */
  definition?: Text;

  /** Usage notes for this Phrase. */
  usageNotes: readonly Text[];

  /** Registers of use this Phrase is associated with. */
  registerCodes: readonly RegisterCode[];

  /** Dialects this Phrase is associated with. */
  dialectCodes: readonly Code[];

  /** Editorial labels applying to this Phrase. */
  editorialLabels: readonly EditorialLabel[];

  /** Sources this Phrase's own record was compiled from. */
  sourceReferences: readonly SourceReference[];

  /** Indicates whether this Phrase belongs to the Common Vocabulary. */
  isCommon: boolean;

  /**
   * Subdomain distinguishing this Phrase's own sense from another
   * sense sharing the same lexical form and part of speech.
   *
   * Undefined when this Phrase's own sense needs no such distinction.
   */
  domainTag?: Text;

  /**
   * Every additional topic domain this Phrase's own sense belongs to,
   * beyond the one named by `domainTag`.
   *
   * Empty when this Phrase's own sense belongs to at most one topic
   * domain.
   */
  relatedDomainTags: readonly Text[];


  // ── References ───────────────────────────────────────────

  /**
   * Identifier of the Princeton WordNet 3.1 synset this Phrase
   * corresponds to.
   *
   * Undefined for a Phrase that didn't come from WordSeeder.seedWordNet.
   */
  synsetId?: Identifier;

  /**
   * Identifiers of every Sense (data/entities/sense.ts) this Phrase
   * lexicalizes.
   *
   * Empty for a Phrase that didn't come from WordSeeder.seedWordNet.
   */
  senseIds: readonly Identifier[];


  // ── Structure ────────────────────────────────────────────

  /**
   * This Phrase's own `text` broken down into its constituent Words,
   * one entry per whitespace-separated token, left to right, stored by
   * reference.
   *
   * A given position is undefined when no Word for that token exists
   * in the seeding Dictionary. Always empty for a Common Vocabulary
   * Cache closed-class Phrase.
   */
  words: readonly (Identifier | undefined)[];

  /**
   * The ModifierRole each position in `words` plays within this
   * Phrase's own structure -- same length and index alignment as
   * `words` itself.
   *
   * A position is undefined when that word carries no role of its own
   * within this Phrase. Always empty for a Common Vocabulary Cache
   * closed-class Phrase.
   */
  wordRoles: readonly (ModifierRole | undefined)[];

  /**
   * The one entry of `words` whose matching `wordRoles` position holds
   * ModifierRole.HEAD -- an unresolved graph-reference pointer, not
   * the resolved Word entity itself (`headWord` below is that).
   *
   * Undefined whenever `wordRoles` holds no HEAD position at all.
   */
  unresolvedHeadWord?: Identifier;

  /**
   * `unresolvedHeadWord`'s own literal spelling as it actually appears
   * in this Phrase's own `text`.
   *
   * Undefined under the exact same conditions `unresolvedHeadWord` is.
   */
  headWordForm?: Text;

  /**
   * The Head's own resolved Word entity. Every `*_phrase.ts` subtype
   * narrows this down to the specific Word subtype(s) its own Head
   * Identification Rule allows.
   *
   * Undefined for a Common Vocabulary Cache closed-class Phrase.
   */
  headWord?: Word;

  /**
   * This Phrase's own pre-Head modifying constituents. Every
   * `*_phrase.ts` subtype narrows this down to the specific
   * constituent type(s) its own MODIFIER row allows.
   *
   * Undefined for a Common Vocabulary Cache closed-class Phrase.
   */
  preModifiers?: readonly (Word | Phrase | Clause)[];

  /**
   * This Phrase's own post-Head modifying constituents --
   * `preModifiers`'s own counterpart.
   *
   * Undefined for a Common Vocabulary Cache closed-class Phrase.
   */
  postModifiers?: readonly (Word | Phrase | Clause)[];
}

export type PhraseInit = Pick<Phrase, "text" | "partOfSpeech"> & Partial<Omit<Phrase, "text" | "partOfSpeech">>;

export function createPhrase(init: PhraseInit): Phrase {
  const phrase: Phrase = {
    usageNotes: [],
    registerCodes: [],
    dialectCodes: [],
    editorialLabels: [],
    sourceReferences: [],
    relatedDomainTags: [],
    words: [],
    wordRoles: [],
    senseIds: [],
    isCommon: false,
    entryId: init.entryId ?? identifier(newUuid()),
    version: init.version ?? { value: "1.0" },
    languageCode: init.languageCode ?? { value: "en" },
    ...init,
  };
  if (phrase.lexicalForm === undefined) phrase.lexicalForm = { value: phrase.text };
  if (phrase.normalisedForm === undefined) phrase.normalisedForm = { value: phrase.text.toLowerCase() };
  return phrase;
}

/** A shallow copy of `phrase`, sharing every field's own object identity
 * except `entryId.uuid`, which becomes a fresh uuid. The Phrase
 * counterpart of copyWordWithFreshUuid (role/word_processor.ts). */
export function copyPhraseWithFreshUuid(phrase: Phrase): Phrase {
  return { ...phrase, entryId: { ...phrase.entryId, uuid: newUuid() } };
}

/** `phrase`'s own per-Domain graph identity. Word's own identical
 * graphUuid() (role/word_processor.ts). */
export function graphUuid(phrase: Phrase): string {
  return phrase.entryId.uuid!;
}

/** Materialises `phrase` as a synthetic, one-off Word -- never inserted
 * into any Dictionary, only ever handed to a Linguistics-facing caller
 * that expects a WordIdentifier's own `.word: Word` field. A fresh
 * `entryId.uuid` on every call is correct, not a bug: this Word is a
 * token, never persisted or looked up again by identity. */
export function toSyntheticWord(phrase: Phrase): Word {
  return createWord({
    text: phrase.text,
    entryId: { ...phrase.entryId, uuid: newUuid() },
    partOfSpeech: phrase.partOfSpeech,
    gloss: phrase.gloss,
    usageNotes: phrase.usageNotes,
    registerCodes: phrase.registerCodes,
    dialectCodes: phrase.dialectCodes,
    editorialLabels: phrase.editorialLabels,
    sourceReferences: phrase.sourceReferences,
    isCommon: phrase.isCommon,
  });
}

/** Materialises `phrase` as a Word-shaped view preserving its own
 * identity -- unlike toSyntheticWord above, this is not a fresh token:
 * the returned Word resolves under the identical identity the Phrase
 * itself is known by. `wordForms`, when supplied, registers a matching
 * base-lemma WordForm carrying this Phrase's own senseIds/synsetId. */
export function phraseAsWord(phrase: Phrase, wordForms?: WordForms): Word {
  const word = createWord({
    text: phrase.text,
    entryId: phrase.entryId,
    partOfSpeech: phrase.partOfSpeech,
    gloss: phrase.gloss,
    usageNotes: phrase.usageNotes,
    registerCodes: phrase.registerCodes,
    dialectCodes: phrase.dialectCodes,
    editorialLabels: phrase.editorialLabels,
    sourceReferences: phrase.sourceReferences,
    isCommon: phrase.isCommon,
    domainTag: phrase.domainTag,
    relatedDomainTags: phrase.relatedDomainTags,
  });
  const form = wordForms?.registerBaseLemmaForm(word, undefined, { synsetId: phrase.synsetId });
  if (form !== undefined) form.senseIds = phrase.senseIds;
  return word;
}
