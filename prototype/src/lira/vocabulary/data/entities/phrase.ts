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

import { identifier, type Identifier, type Text } from "../../../value_objects";
import type { Clause } from "../../../linguistics/data/clause";
import type { LinguisticUnit } from "../../../linguistics/data/linguistic_unit";
import type { EditorialLabel } from "../enums/editorial_label";
import type { PhraseType } from "../enums/phrase_type";
import type { SourceReference } from "../source_reference";
import type { Word } from "./word";
import type { Phrases } from "../phrases";
import type { WordForms } from "../word_forms";
// Known, approved exception to data/ never importing role/ -- see
// role/word_processor.ts's own docstring: createWord() is Word's own
// base-entity constructor, needed here (toSyntheticWord/phraseAsWord
// below) the same way every POS processor already needs it.
import { createWord } from "../../role/word_processor";
import { newUuid } from "../uuid";

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
   * Undefined for most Common Vocabulary Cache closed-class Phrases --
   * they have no constituency-parsing pass of their own the way a
   * WordNet-seeded one does. The one exception is a PRONOUN-tagged
   * closed-class Phrase (pronouns.json's 17 real multi-word idioms:
   * "each other", "no one", "the former", ...): `role/word_seeder.ts`'s
   * `entryToPhrase()` genuinely classifies these as `NOUN_PHRASE`, a
   * Pronoun-headed phrase being structurally a Noun Phrase
   * (data/entities/noun_phrase.ts's own docstring).
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
   * Carries this Phrase's own version/language/dialect/register-style, on
   * `Text`'s own `version`/`languageCode`/`dialectCode`/`languageStyleCode`
   * supplementary components (value_objects/data/text.ts's own docstring)
   * -- a Phrase has no top-level `version`/`languageCode`/`dialectCodes`/
   * `registerCodes` fields of its own for those to duplicate: each is a
   * fact about one specific wording, not about the Phrase as a whole
   * (data_entity_design_decisions_log.md).
   *
   * No separate `normalisedForm` field either: a caller wanting this
   * Phrase's own lower-cased form reads it on demand via
   * `textToLowerCase(phrase.lexicalForm)` (value_objects/data/text.ts)
   * instead of a second, always-derivable `Text` kept in sync by hand.
   */
  lexicalForm?: Text;

  /** Definition of this Phrase's own primary sense. */
  definition?: Text;

  /** Usage notes for this Phrase. */
  usageNotes: readonly Text[];

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
   * The one Word, among this Phrase's own `text` broken into its
   * whitespace-separated tokens, whose position `classifyModifierRoles()`
   * (role/processor/phrase_processor.ts) assigns ModifierRole.HEAD -- a
   * graph-reference pointer, resolved against a Dictionary
   * (`Dictionary.findByUuid()`), not an embedded copy of the Word itself.
   *
   * Undefined whenever no token carries the HEAD role at all -- either
   * because this Phrase's own `phraseType` is itself undefined
   * (`classifyModifierRoles()`'s own early-return guard never assigns
   * any role without one, `phraseType`'s own docstring above on which
   * closed-class Phrases that is), or because `phraseType` is set but no
   * token resolves to a Word capable of the matching part of speech
   * ("each other": neither "each" nor "other" is a Noun or Pronoun Word
   * on its own, both being DETERMINER_LEMMAS entries instead,
   * role/determiner_seeder.ts). Every per-token
   * resolution and role assignment this field (and every field below)
   * derives from is computed fresh by `linkPhraseWords()`, not stored on
   * the Phrase itself -- see that function's own docstring on why: once
   * `headWord`/`headWordForm`/`preModifiers`/`postModifiers`/`determiners`
   * exist as their own typed fields, keeping the full per-token
   * `words`/`wordRoles` bookkeeping around too would just duplicate the
   * same facts in a second, untyped shape (data_entity_design_decisions_log.md).
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
   * This Phrase's own pre-Head modifying constituents -- each entry
   * either an `Identifier` pointing at the one WordForm (owned by that
   * MODIFIER-role token's own resolved Word) spelled exactly the way it
   * appears here (`headWordForm`'s own identical resolution, one
   * position over), or an embedded sub-Phrase/Clause, for the
   * constituency-parsing case `linkPhraseWords()` never actually
   * performs today (that function's own docstring). Every
   * `*_phrase.ts` subtype narrows this down to the specific constituent
   * type(s) its own MODIFIER row allows.
   *
   * A MODIFIER-role token whose own resolved Word carries no WordForm
   * spelled the way it appears here is left out entirely, the same
   * `headWordForm`-can-fail-to-resolve narrowing documented above. Empty
   * when no token carries the MODIFIER role at all -- always true when
   * `phraseType` is itself undefined (`phraseType`'s own docstring above
   * on which closed-class Phrases that still is), since most PhraseType
   * branches of `classifyModifierRoles()` only ever assign MODIFIER
   * relative to an identified Head position.
   */
  preModifiers?: readonly (Identifier | Phrase | Clause)[];

  /**
   * This Phrase's own post-Head modifying constituents --
   * `preModifiers`'s own counterpart.
   *
   * Empty when no token carries the MODIFIER role at all, `preModifiers`'s
   * own exact reasoning.
   */
  postModifiers?: readonly (Identifier | Phrase | Clause)[];

  /**
   * This Phrase's own DETERMINER-role tokens, in phrase-text order --
   * `preModifiers`'s own exact shape and resolution rule, one
   * ModifierRole over (the Common Rules table's own "Determiner" row,
   * data/phrase_type_patterns_and_word_roles.md, applies regardless of
   * PhraseType or position, so unlike `preModifiers`/`postModifiers`
   * this is never split pre/post -- and, unlike them, never gated on an
   * identified Head position either, so this can be non-empty even for a
   * Phrase whose own `headWord` stays undefined, "each other" among
   * them: both "each" and "other" are real DETERMINER_LEMMAS Words of
   * their own, role/determiner_seeder.ts, so both resolve here despite
   * neither being a Head candidate). Empty far more often than
   * `preModifiers`/`postModifiers` are for a WordNet-seeded Phrase:
   * WordNet lexicalizes almost none of the closed set of English
   * determiners as a standalone sense of its own
   * (`PHRASE_TYPE_DETERMINERS`'s own docstring, role/processor/phrase_processor.ts)
   * -- "the"/"this"/"my" have no WordNet Dictionary entry at all to
   * resolve a WordForm from -- so only the minority of determiner tokens
   * that happen to double as a real WordNet lemma ("few", "many", "all")
   * ever appear here for one of those. A Common Vocabulary Cache
   * PRONOUN-tagged Phrase's own determiner tokens resolve far more
   * reliably, by contrast: `AuxiliarySeeder`/`DeterminerSeeder`
   * (role/auxiliary_seeder.ts, role/determiner_seeder.ts) seed a real
   * closed-class Word (and WordForm) for nearly every core English
   * determiner, "the"/"this"/"my" included.
   */
  determiners?: readonly Identifier[];

  /**
   * This Phrase's own COMPLEMENT-role constituent(s) -- each entry
   * either an `Identifier` pointing at the one WordForm (owned by that
   * COMPLEMENT-role token's own resolved Word) spelled exactly the way
   * it appears here, or an embedded sub-Phrase/Clause, `preModifiers`'
   * own identical two-shape union one ModifierRole over. Every
   * `*_phrase.ts` subtype that declares a COMPLEMENT row in its own
   * `PHRASE_TYPE_DETAILS[...].allowedTypes` (data/enums/phrase_type.ts --
   * NounPhrase, AdjectivePhrase, PrepositionalPhrase today) narrows this
   * down to that row's own specific constituent type(s); VerbPhrase/
   * AdverbPhrase/InfinitivePhrase declare no such row and so never
   * populate this beyond an empty array.
   *
   * Unlike `preModifiers`/`postModifiers`, `linkPhraseWords()`
   * (role/processor/phrase_processor.ts) does perform real constituency
   * parsing to populate this field: a post-Head span of `text` shaped
   * like a genuine Preposition + complement is recognised structurally
   * (the same closed-set `PHRASE_TYPE_PREPOSITIONS` check
   * `classifyPhraseType()` itself already uses one level up) and
   * recursively built into its own nested Phrase, complete with its own
   * `headWord`/`preModifiers`/`postModifiers`/`determiners`/
   * `complements` -- not just left as a bare `Identifier`/skipped the
   * way an ordinary MODIFIER-role sub-phrase still is
   * (`preModifiers`'s own docstring on that gap, still real for the
   * MODIFIER case). See `complementStartIndex()`'s own docstring
   * (role/processor/phrase_processor.ts) for exactly which post-Head
   * span, per PhraseType, is recognised this way.
   *
   * Empty whenever no such span exists -- true for the large majority of
   * real seeded Phrases ("toy poodle", "highly reliable" have none).
   */
  complements?: readonly (Identifier | Phrase | Clause)[];
}

export type PhraseInit = Pick<Phrase, "text"> & Partial<Omit<Phrase, "text">>;

export function createPhrase(init: PhraseInit): Phrase {
  const phrase: Phrase = {
    usageNotes: [],
    editorialLabels: [],
    sourceReferences: [],
    relatedDomainTags: [],
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
    definition: phrase.definition,
    usageNotes: phrase.usageNotes,
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
    definition: phrase.definition,
    usageNotes: phrase.usageNotes,
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
