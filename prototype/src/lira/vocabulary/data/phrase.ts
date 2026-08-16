/** Phrase: one multi-word closed-class lexical item -- "in spite of",
 * "each other", "according to" -- previously modelled as an ordinary
 * `Word` whose `text` happened to contain whitespace (Design Principle
 * 1's own original rationale, vocabulary/documentation/README.md). A
 * Phrase is a genuinely separate lexical category from a single-word
 * Word: it names a fixed multi-token span that functions as one
 * grammatical unit, the same role a Word plays for a single token, but
 * kept in its own store (PhraseBook, phrase_book.ts) rather than
 * Dictionary so a caller can tell "this Domain's single-word lexicon"
 * and "this Domain's multi-word lexicon" apart without inspecting
 * `text` for a space.
 *
 * Deliberately not a WordNet-facing concept: a WordNet lemma that
 * happens to be multi-word ("toy poodle", "ice cream") is a genuine
 * dictionary sense, not a grammatical-function phrase, and stays an
 * ordinary multi-word Word exactly as before -- only the Common
 * Vocabulary Cache's own closed-class multi-word entries
 * (word_seeder.ts's own seedClosedClassWords, never seedWordNet)
 * become Phrases.
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
}

export type PhraseInit = Pick<Phrase, "text" | "partOfSpeech"> & Partial<Omit<Phrase, "text" | "partOfSpeech">>;

export function createPhrase(init: PhraseInit): Phrase {
  const phrase: Phrase = {
    usageNotes: [],
    registerCodes: [],
    dialectCodes: [],
    editorialLabels: [],
    sourceReferences: [],
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
