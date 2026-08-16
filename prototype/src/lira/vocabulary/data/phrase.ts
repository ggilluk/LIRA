/** Phrase: one multi-word lexical item -- a closed-class grammatical
 * span ("in spite of", "each other", "according to") or a multi-word
 * WordNet lemma ("toy poodle", "ice cream") -- previously modelled as
 * an ordinary `Word` whose `text` happened to contain whitespace
 * (Design Principle 1's own original rationale,
 * vocabulary/documentation/README.md). A Phrase is a genuinely
 * separate lexical category from a single-word Word: it names a fixed
 * multi-token span that functions as one grammatical unit, the same
 * role a Word plays for a single token, but kept in its own store
 * (PhraseBook, phrase_book.ts) rather than Dictionary so a caller can
 * tell "this Domain's single-word lexicon" and "this Domain's
 * multi-word lexicon" apart without inspecting `text` for a space.
 *
 * A WordNet-facing concept too, not just the Common Vocabulary Cache's
 * own closed-class multi-word entries: WordSeeder.seedWordNet routes
 * any multi-word synset lemma here exactly the same way
 * seedClosedClassWords already does for the cache (word_seeder.ts's
 * own isMultiWord() check, shared by both paths), and wires it into
 * the SYNONYM/pointer-relationship graph exactly like a single-word
 * synset member -- `domainTag`/`relatedDomainTags`/`synsetId` below
 * exist for that path specifically, mirroring the identically-named
 * Word fields (see each one's own docstring on word.ts).
 *
 * Still shaped like Linguistics's LinguisticUnit, the same deliberate
 * dual-use Word already has (word.ts's own docstring): a Phrase is
 * both a Vocabulary *type* (a lexical entry, owned by this layer) and,
 * via `toSyntheticWord` below, materialisable as a Linguistics *token*
 * (one occurrence of that type in a sentence) without Linguistics ever
 * needing its own notion of a multi-word Vocabulary entry -- it already
 * reads every token as a Word-shaped LinguisticUnit regardless of how
 * many raw source tokens that one reading actually consumed
 * (TokenReading.tokenSpan, linguistics/data/token_reading.ts). */

import type { Code, Identifier, Text } from "../../value_objects";
import type { LinguisticUnit } from "../../linguistics/data/linguistic_unit";
import type { EditorialLabel } from "./editorial_label";
import type { PartOfSpeech } from "./part_of_speech";
import type { RegisterCode } from "./register_code";
import type { SourceReference } from "./source_reference";
import { createWord, type Word } from "./word";
import { newUuid } from "./uuid";

export interface Phrase extends LinguisticUnit {
  partOfSpeech: PartOfSpeech;

  uuid: Identifier;

  // Same persistent-vs-per-Domain-copy distinction as Word.entryId/
  // Word.uuid (word.ts's own docstring) -- entryId is assigned once,
  // when a Phrase is first authored in the Common Vocabulary Cache,
  // and stays untouched by every later per-Domain copy; uuid is fresh
  // every time.
  entryId: Identifier;

  // The Princeton WordNet 3.1 synset this Phrase corresponds to, when
  // known -- Word.synsetId's own exact counterpart, undefined for a
  // Phrase that didn't come from WordSeeder.seedWordNet (every
  // Common Vocabulary Cache closed-class Phrase, in particular).
  synsetId?: Identifier;

  version: Text;
  languageCode: Code;
  lexicalForm?: Text;
  normalisedForm?: Text;
  gloss?: Text;
  definition?: Text;
  usageNotes: readonly Text[];
  registerCodes: readonly RegisterCode[];
  dialectCodes: readonly Code[];
  editorialLabels: readonly EditorialLabel[];
  sourceReferences: readonly SourceReference[];

  // True only for a Phrase loaded from the English Common Vocabulary
  // Cache (or another language's equivalent) by WordSeeder -- never
  // set true by hand. Mirrors Word.isCommon exactly.
  isCommon: boolean;

  // Word.domainTag/Word.relatedDomainTags's own exact counterparts,
  // populated the same way by WordSeeder.seedWordNet's topic-domain
  // tagging pass for a multi-word synset member -- always empty/
  // undefined for a Common Vocabulary Cache closed-class Phrase.
  domainTag?: Text;
  relatedDomainTags: readonly Text[];

  // This Phrase's own `text` broken down into its constituent Words,
  // one entry per whitespace-separated token, in the same left-to-right
  // order they appear in `text` -- e.g. "toy poodle" -> [toy's own
  // uuid, poodle's own uuid]. Stored *by reference* (an Identifier,
  // the same "point at a uuid, don't embed a copy of the Word itself"
  // convention LexicalRelationship's own sourceWordId/targetWordId
  // already use -- resolved the same way, via Dictionary.findByUuid),
  // not a duplicated Word snapshot that could drift out of sync with
  // the Dictionary's own copy. A given position is undefined when no
  // Word for that token exists in the seeding Dictionary (WordNet
  // itself never lexicalizes some closed-class function words on their
  // own) -- reported, not guessed, the same convention
  // DefinitionWordReference already uses for an unresolved definition
  // token (data/definition_word_reference.ts). Populated by
  // WordSeeder.seedWordNet only, after its own pass 1 has finished
  // seeding every single-word synset member -- always empty for a
  // Common Vocabulary Cache closed-class Phrase, which has no
  // per-token composition need of its own.
  words: readonly (Identifier | undefined)[];
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
    isCommon: false,
    uuid: init.uuid ?? { value: newUuid() },
    entryId: init.entryId ?? { value: newUuid() },
    version: init.version ?? { value: "1.0" },
    languageCode: init.languageCode ?? { value: "en" },
    ...init,
  };
  if (phrase.lexicalForm === undefined) phrase.lexicalForm = { value: phrase.text };
  if (phrase.normalisedForm === undefined) phrase.normalisedForm = { value: phrase.text.toLowerCase() };
  return phrase;
}

/** A shallow copy of `phrase`, sharing every field's own object
 * identity except `uuid`, which becomes a fresh Identifier -- the
 * Phrase counterpart of copyWordWithFreshUuid (word.ts), used by
 * PhraseBook.seedFrom/WordSeeder.seedClosedClassWords for exactly the
 * same reason: two Domains' independent copies of "in spite of" must
 * never be confused as the same graph node. */
export function copyPhraseWithFreshUuid(phrase: Phrase): Phrase {
  return { ...phrase, uuid: { value: newUuid() } };
}

/** Materialises `phrase` as a synthetic, one-off Word -- never
 * inserted into any Dictionary, only ever handed to a Linguistics-
 * facing caller (DictionaryProcessor.identifyPhrase()) that expects a
 * WordIdentification's own `.word: Word` field. This is the token side
 * of the dual use this file's own docstring describes: Vocabulary's
 * durable, authoritative record of "in spite of" is the Phrase this
 * was built from (PhraseBook, not Dictionary), but Linguistics' own
 * reading tree has no separate notion of a multi-word Vocabulary entry
 * -- it materialises every resolved span, one word or several raw
 * tokens wide, as one Word-shaped LinguisticUnit either way. A fresh
 * uuid each call is correct, not a bug: this Word is a token (one
 * occurrence in one reading), never persisted or looked up again by
 * identity, the same as any other Word materialised for a sentence. */
export function toSyntheticWord(phrase: Phrase): Word {
  return createWord({
    text: phrase.text,
    entryId: phrase.entryId,
    partOfSpeech: phrase.partOfSpeech,
    version: phrase.version,
    languageCode: phrase.languageCode,
    lexicalForm: phrase.lexicalForm,
    normalisedForm: phrase.normalisedForm,
    gloss: phrase.gloss,
    definition: phrase.definition,
    usageNotes: phrase.usageNotes,
    registerCodes: phrase.registerCodes,
    dialectCodes: phrase.dialectCodes,
    editorialLabels: phrase.editorialLabels,
    sourceReferences: phrase.sourceReferences,
    isCommon: phrase.isCommon,
  });
}

/** Materialises `phrase` as a Word-shaped view *preserving its own
 * uuid* -- unlike toSyntheticWord above, this is not a fresh token:
 * it is the identity-preserving projection used wherever a Phrase
 * needs to be resolved and displayed exactly like a Word, because a
 * LexicalRelationship's sourceWordId/targetWordId is an opaque uuid
 * string that doesn't record which store (Dictionary or PhraseBook)
 * it came from (LexicalRelationshipStore's own docstring). A WordNet-
 * seeded multi-word Phrase participates in the same SYNONYM/pointer
 * relationship graph a single-word synset member does
 * (WordSeeder.seedWordNet), so every place that resolves a
 * relationship endpoint -- word.ts's own relatedWords() family,
 * DictionaryView's relationship/Hierarchy rendering -- needs to be
 * able to turn that endpoint back into something displayable
 * regardless of which store actually holds it; this is that
 * conversion, called only after a Dictionary lookup by the same uuid
 * has already failed. */
export function phraseAsWord(phrase: Phrase): Word {
  return createWord({
    text: phrase.text,
    uuid: phrase.uuid,
    entryId: phrase.entryId,
    synsetId: phrase.synsetId,
    partOfSpeech: phrase.partOfSpeech,
    version: phrase.version,
    languageCode: phrase.languageCode,
    lexicalForm: phrase.lexicalForm,
    normalisedForm: phrase.normalisedForm,
    gloss: phrase.gloss,
    definition: phrase.definition,
    usageNotes: phrase.usageNotes,
    registerCodes: phrase.registerCodes,
    dialectCodes: phrase.dialectCodes,
    editorialLabels: phrase.editorialLabels,
    sourceReferences: phrase.sourceReferences,
    isCommon: phrase.isCommon,
    domainTag: phrase.domainTag,
    relatedDomainTags: phrase.relatedDomainTags,
  });
}
