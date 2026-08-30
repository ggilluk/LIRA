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

import { identifier, type Identifier, type Text } from "../../value_objects";
import type { Clause } from "../../linguistics/data/clause";
import type { LinguisticUnit } from "../../linguistics/data/linguistic_unit";
import type { EditorialLabel } from "./enums/editorial_label";
import type { ModifierRole } from "./enums/modifier_role";
import type { PhraseType } from "./enums/phrase_type";
import type { RegisterCode } from "./enums/register_code";
import type { SourceReference } from "./source_reference";
import type { Word } from "./entities/word";
import type { Phrases } from "./phrases";
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

  /**
   * The grammatical shape this Phrase's own words take -- noun phrase,
   * verb phrase, etc.
   *
   * Undefined for a Common Vocabulary Cache closed-class Phrase.
   *
   * Unlike Word, a Phrase carries no `partOfSpeech` field of its own --
   * that WordNet-tagged fact (`phraseType`'s own input, not an
   * independent one) lives in a private side index inside `Phrases`
   * instead, read back via `Phrases.partOfSpeechOf(phrase)`
   * (data/phrases.ts, data_entity_design_decisions_log.md).
   */
  phraseType?: PhraseType;


  // ── Data Attributes ──────────────────────────────────────

  /**
   * This Phrase's own canonical written form.
   *
   * Carries this Phrase's own version/language/dialect, on `Text`'s own
   * `version`/`languageCode`/`dialectCode` supplementary components
   * (value_objects/data/text.ts's own docstring) -- a Phrase has no
   * top-level `version`/`languageCode`/`dialectCodes` fields of its own
   * for those to duplicate: each is a fact about one specific wording,
   * not about the Phrase as a whole (data_entity_design_decisions_log.md).
   *
   * No separate `normalisedForm` field either: a caller wanting this
   * Phrase's own lower-cased form reads it on demand via
   * `textToLowerCase(phrase.lexicalForm)` (value_objects/data/text.ts)
   * instead of a second, always-derivable `Text` kept in sync by hand.
   */
  lexicalForm?: Text;

  /** Short gloss summarising this Phrase's own primary sense. */
  gloss?: Text;

  /** Definition of this Phrase's own primary sense. */
  definition?: Text;

  /** Usage notes for this Phrase. */
  usageNotes: readonly Text[];

  /** Registers of use this Phrase is associated with. */
  registerCodes: readonly RegisterCode[];

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
   * Identifiers of every Sense (data/entities/sense.ts) this Phrase
   * lexicalizes.
   *
   * Empty for a Phrase that didn't come from WordSeeder.seedWordNet.
   *
   * Carries no `synsetId` of its own: WordNet's own synset identifier
   * is an externally-defined attribute, not a fact intrinsic to a
   * Phrase's own shape (Sense's own docstring, the identical reasoning)
   * -- mapped onto `senseIds[0]` via `Phrases.synsetIdOf(phrase)`
   * instead (data/phrases.ts).
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
   * ModifierRole.HEAD -- a graph-reference pointer, resolved against a
   * Dictionary (`Dictionary.findByUuid()`) the same way any other entry
   * of `words` is, not an embedded copy of the Word itself.
   *
   * Undefined whenever `wordRoles` holds no HEAD position at all, or
   * for a Common Vocabulary Cache closed-class Phrase.
   */
  headWord?: Identifier;

  /**
   * The one WordForm (data/entities/word_form.ts), owned by `headWord`'s
   * own resolved Word, whose own spelling exactly matches `headWord`'s
   * literal occurrence in this Phrase's own `text` -- a graph-reference
   * pointer, resolved against a WordForms store (`WordForms.findByUuid()`),
   * not an embedded `Text` copy of the spelling itself.
   *
   * Undefined whenever `headWord` is, and also whenever `headWord`'s own
   * resolved Word carries no registered WordForm spelled exactly the way
   * it appears here.
   */
  headWordForm?: Identifier;

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

export type PhraseInit = Pick<Phrase, "text"> & Partial<Omit<Phrase, "text">>;

export function createPhrase(init: PhraseInit): Phrase {
  const phrase: Phrase = {
    usageNotes: [],
    registerCodes: [],
    editorialLabels: [],
    sourceReferences: [],
    relatedDomainTags: [],
    words: [],
    wordRoles: [],
    senseIds: [],
    isCommon: false,
    entryId: init.entryId ?? identifier(newUuid()),
    ...init,
  };
  if (phrase.lexicalForm === undefined) phrase.lexicalForm = { value: phrase.text };
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
 * token, never persisted or looked up again by identity. `phrases` is
 * the store `phrase` itself came from -- its own `partOfSpeechOf()` is
 * where `phrase`'s WordNet-tagged part of speech actually lives now,
 * Phrase itself carries no such field (data_entity_design_decisions_log.md). */
export function toSyntheticWord(phrase: Phrase, phrases: Phrases): Word {
  return createWord({
    text: phrase.text,
    entryId: { ...phrase.entryId, uuid: newUuid() },
    partOfSpeech: phrases.partOfSpeechOf(phrase)!,
    gloss: phrase.gloss,
    usageNotes: phrase.usageNotes,
    registerCodes: phrase.registerCodes,
    editorialLabels: phrase.editorialLabels,
    sourceReferences: phrase.sourceReferences,
    isCommon: phrase.isCommon,
  });
}

/** Materialises `phrase` as a Word-shaped view preserving its own
 * identity -- unlike toSyntheticWord above, this is not a fresh token:
 * the returned Word resolves under the identical identity the Phrase
 * itself is known by. `phrases` is the store `phrase` itself came from,
 * the same way toSyntheticWord above needs it. `wordForms`, when
 * supplied, registers a matching base-lemma WordForm carrying this
 * Phrase's own senseIds/synsetId. */
export function phraseAsWord(phrase: Phrase, phrases: Phrases, wordForms?: WordForms): Word {
  const word = createWord({
    text: phrase.text,
    entryId: phrase.entryId,
    partOfSpeech: phrases.partOfSpeechOf(phrase)!,
    gloss: phrase.gloss,
    usageNotes: phrase.usageNotes,
    registerCodes: phrase.registerCodes,
    editorialLabels: phrase.editorialLabels,
    sourceReferences: phrase.sourceReferences,
    isCommon: phrase.isCommon,
    domainTag: phrase.domainTag,
    relatedDomainTags: phrase.relatedDomainTags,
  });
  // Passes phrase.lexicalForm straight through as this synthetic Word's
  // own base-lemma WordForm text -- the same rich Text (language/
  // dialect/version) the Phrase itself carries, not a bare `{value:
  // word.text}` default that would silently drop it.
  const form = wordForms?.registerBaseLemmaForm(word, phrase.lexicalForm, undefined, phrases.synsetIdOf(phrase));
  if (form !== undefined) form.senseIds = phrase.senseIds;
  return word;
}
