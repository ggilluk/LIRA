/** Phrase: one multi-word lexical item -- a closed-class grammatical
 * span ("in spite of", "each other", "according to") or a multi-word
 * WordNet lemma ("toy poodle", "ice cream") -- previously modelled as
 * an ordinary `Word` whose `text` happened to contain whitespace
 * (Design Principle 1's own original rationale,
 * vocabulary/documentation/README.md). A Phrase is a genuinely
 * separate lexical category from a single-word Word: it names a fixed
 * multi-token span that functions as one grammatical unit, the same
 * role a Word plays for a single token, but kept in its own store
 * (Phrases, phrases.ts) rather than Dictionary so a caller can
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
 * Word fields (see each one's own docstring on data/entities/word.ts).
 *
 * Still shaped like Linguistics's LinguisticUnit, the same deliberate
 * dual-use Word already has (data/entities/word.ts's own docstring): a Phrase is
 * both a Vocabulary *type* (a lexical entry, owned by this layer) and,
 * via `toSyntheticWord` below, materialisable as a Linguistics *token*
 * (one occurrence of that type in a sentence) without Linguistics ever
 * needing its own notion of a multi-word Vocabulary entry -- it already
 * reads every token as a Word-shaped LinguisticUnit regardless of how
 * many raw source tokens that one reading actually consumed
 * (TokenReading.tokenSpan, linguistics/data/token_reading.ts). */

import type { Code, Identifier, Text } from "../../value_objects";
import type { LinguisticUnit } from "../../linguistics/data/linguistic_unit";
import type { EditorialLabel } from "./enums/editorial_label";
import type { PartOfSpeech } from "./enums/part_of_speech";
import type { PhraseRole } from "./enums/phrase_role";
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
  partOfSpeech: PartOfSpeech;

  // The grammatical shape this Phrase's own words take -- noun phrase,
  // verb phrase, etc. (PhraseType's own docstring on how this differs
  // from partOfSpeech above). Populated by WordSeeder.seedWordNet's own
  // classifyPhraseType() (role/word_seeder.ts) for every multi-word
  // WordNet synset lemma -- structurally derived from the lemma's own
  // tokens and part of speech, not guessed (that function's own
  // docstring on the real dict/ distribution this was built from).
  // Undefined for a Common Vocabulary Cache closed-class Phrase, which
  // has no constituency-parsing pass of its own, and for the handful of
  // WordNet parts of speech classifyPhraseType() itself never maps
  // (dead code against real WordNet data today -- every real multi-word
  // lemma is NOUN/VERB/ADJECTIVE/ADVERB). data/entities/noun_phrase.ts
  // and its five siblings (one per PhraseType member) narrow a Phrase
  // down by this field the same way data/entities/noun.ts and its own
  // siblings narrow a Word down by partOfSpeech.
  phraseType?: PhraseType;

  uuid: Identifier;

  // Same persistent-vs-per-Domain-copy distinction Word's own entryId
  // now folds into one Identifier (`entryId.value`/`entryId.uuid`,
  // data/entities/word.ts's own docstring) -- Phrase deliberately keeps
  // the two as separate top-level fields, out of scope for that fold
  // (data/entities/word_form.ts's own decision-log entry on why it applies
  // to WordForm/Word/Sense specifically, not to Phrase). entryId is
  // assigned once, when a Phrase is first authored in the Common
  // Vocabulary Cache, and stays untouched by every later per-Domain
  // copy; uuid (below) is fresh every time.
  entryId: Identifier;

  // The Princeton WordNet 3.1 synset this Phrase corresponds to, when
  // known -- Word.synsetId's own exact counterpart, undefined for a
  // Phrase that didn't come from WordSeeder.seedWordNet (every
  // Common Vocabulary Cache closed-class Phrase, in particular).
  synsetId?: Identifier;

  // Word.senseIds's own exact counterpart -- every Sense (data/entities/sense.ts)
  // this Phrase lexicalizes, distinct from synsetId above (data/entities/sense.ts's
  // own docstring on the distinction). Empty for a Phrase that didn't
  // come from WordSeeder.seedWordNet.
  senseIds: readonly Identifier[];

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

  // The PhraseRole (enums/phrase_role.ts) each position in `words` plays
  // within this Phrase's own structure -- same length and index
  // alignment as `words` itself, one entry per whitespace-separated
  // token. `undefined` at a position means that word retains only its
  // own Part of Speech, no separate Phrase Role (the "No Role" Common
  // Rule, data/phrase_type_patterns_and_word_roles.md) -- either because
  // it's a token `words` itself couldn't resolve, or because the Head
  // Identification Rule/Word Role Assignment for this Phrase's own
  // `phraseType` genuinely doesn't assign that position a role (a
  // post-head Noun in a Prepositional Phrase, for instance). Exactly one
  // position holds PhraseRole.HEAD when `phraseType` is defined and at
  // least one word resolves to that type's own Head part of speech --
  // never more than one, per that document's own "Head" Common Rule.
  // Populated by WordSeeder.seedWordNet's own classifyPhraseRoles()
  // (role/word_seeder.ts, that function's own docstring for the full
  // per-PhraseType Head/Modifier/Particle/Determiner rules), right after
  // `words` itself is resolved -- always empty for a Common Vocabulary
  // Cache closed-class Phrase, `words`'s own exact counterpart there.
  wordRoles: readonly (PhraseRole | undefined)[];

  // The one entry of `words` whose matching `wordRoles` position holds
  // PhraseRole.HEAD -- "poodle" for "toy poodle", "at" for "at fault"
  // (that PhraseRole's own docstring, and classifyPhraseRoles()'s, on
  // exactly which position that is per PhraseType). Simply
  // `words[wordRoles.indexOf(PhraseRole.HEAD)]`, kept as its own field
  // rather than left for every caller to re-derive by scanning
  // `wordRoles` -- linkPhraseWords() (role/word_seeder.ts) already knows
  // the Head's own index the moment it computes `wordRoles`, so it sets
  // this alongside it in the same pass. Undefined whenever `wordRoles`
  // holds no HEAD position at all
  // -- `phraseType` itself undefined (every Common Vocabulary Cache
  // closed-class Phrase), or a `phraseType` whose own Head Identification
  // Rule found no matching token (classifyPhraseRoles()'s own docstring,
  // e.g. a Preposition Head that isn't in PHRASE_TYPE_PREPOSITIONS and
  // has no matching Dictionary sense either) -- or when that one Head
  // position's own `words` entry itself never resolved (undefined, same
  // as any other unresolved token, `words`'s own docstring).
  //
  // Named `unresolvedHeadWord`, not `headWord` -- an `Identifier` is a
  // graph-reference pointer a caller still has to resolve against a
  // Dictionary (builder_phrase.ts's own `phraseHeadWordSegment()`, in
  // particular), never the resolved Word entity itself. `headWord`
  // below is reserved for that resolved value.
  unresolvedHeadWord?: Identifier;

  // unresolvedHeadWord's own literal spelling as it actually appears in
  // this Phrase's own `text` -- the token classifyPhraseRoles()
  // identified as the Head, before Dictionary resolution ("at" in "at
  // fault", never resolved to any Word at all -- unresolvedHeadWord
  // itself is undefined there, but headWordForm still names which token
  // filled that role). Distinct from headWord's own resolved
  // Word.lexicalForm on purpose: this is the phrase-local surface form
  // (matters for a token whose casing or inflection in this exact
  // phrase might differ from that Word's own canonical spelling
  // elsewhere), not a second copy of the same fact. Undefined under the
  // exact same conditions unresolvedHeadWord is.
  headWordForm?: Text;

  // The Head's own resolved Word entity -- never set by anything in
  // this codebase today; declared ahead of any real seeder that
  // populates it, the same "named ahead of the field(s) that will
  // eventually carry it" status PhraseRole.COMPLEMENT itself has
  // (enums/phrase_role.ts's own docstring). Every `*_phrase.ts` subtype
  // narrows this down to the specific Word subtype(s) its own Head
  // Identification Rule allows -- NounPhrase to `Noun | Pronoun`
  // (data/entities/noun_phrase.ts), for instance -- the same way each
  // subtype already narrows `phraseType` to one literal PhraseType
  // member. Distinct from `unresolvedHeadWord` above: that field is the
  // graph-reference pointer a caller resolves via
  // `Dictionary.findByUuid()` today; this field is reserved for the
  // resolved Word itself, once something populates it.
  headWord?: Word;
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
 * Phrase counterpart of copyWordWithFreshUuid (role/word_processor.ts), used by
 * Phrases.seedFrom/WordSeeder.seedClosedClassWords for exactly the
 * same reason: two Domains' independent copies of "in spite of" must
 * never be confused as the same graph node. */
export function copyPhraseWithFreshUuid(phrase: Phrase): Phrase {
  return { ...phrase, uuid: { value: newUuid() } };
}

/** Materialises `phrase` as a synthetic, one-off Word -- never
 * inserted into any Dictionary, only ever handed to a Linguistics-
 * facing caller (DictionaryProcessor.identifyPhrase()) that expects a
 * WordIdentifier's own `.word: Word` field. This is the token side
 * of the dual use this file's own docstring describes: Vocabulary's
 * durable, authoritative record of "in spite of" is the Phrase this
 * was built from (Phrases, not Dictionary), but Linguistics' own
 * reading tree has no separate notion of a multi-word Vocabulary entry
 * -- it materialises every resolved span, one word or several raw
 * tokens wide, as one Word-shaped LinguisticUnit either way. A fresh
 * uuid each call is correct, not a bug: this Word is a token (one
 * occurrence in one reading), never persisted or looked up again by
 * identity, the same as any other Word materialised for a sentence. */
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

/** Materialises `phrase` as a Word-shaped view *preserving its own
 * uuid* -- unlike toSyntheticWord above, this is not a fresh token:
 * it is the identity-preserving projection used wherever a Phrase
 * needs to be resolved and displayed exactly like a Word, because a
 * LexicalRelationship's sourceWordId/targetWordId is an opaque uuid
 * string that doesn't record which store (Dictionary or Phrases)
 * it came from (LexicalRelationshipStore's own docstring). A WordNet-
 * seeded multi-word Phrase participates in the same SYNONYM/pointer
 * relationship graph a single-word synset member does
 * (WordSeeder.seedWordNet), so every place that resolves a
 * relationship endpoint -- role/word_processor.ts's own relatedWords() family,
 * DictionaryView's relationship/Hierarchy rendering -- needs to be
 * able to turn that endpoint back into something displayable
 * regardless of which store actually holds it; this is that
 * conversion, called only after a Dictionary lookup by the same uuid
 * has already failed.
 *
 * `wordForms`, when supplied, registers a matching base-lemma WordForm
 * under this same `phrase.uuid` (idempotent, WordForms.registerBaseLemmaForm()'s
 * own find-or-create), carrying `phrase.senseIds`/`phrase.synsetId` --
 * senseIds/synsetId are Word-only fields no longer, they live on a
 * Word's own base-lemma WordForm now (WordForm's own docstring on why),
 * and a bare `createWord()` result has no WordForm of its own unless
 * something registers one. Without `wordForms`, the returned Word
 * carries no senses at all -- correct for a caller that only needs
 * `.text`/`.partOfSpeech`, wrong for one that also needs to resolve
 * this Phrase's own meaning (builder_word.ts's own wordRecordFor(),
 * in particular, which is why its own two call sites always pass one). */
export function phraseAsWord(phrase: Phrase, wordForms?: WordForms): Word {
  const word = createWord({
    text: phrase.text,
    // Word's own entryId now carries both roles Phrase still keeps
    // separate (`data/entities/word.ts`'s own docstring on the fold) --
    // entryId.value from phrase.entryId (the stable identity) and
    // entryId.uuid from phrase.uuid.value (the per-Domain graph
    // identity), so this synthetic Word resolves under the identical
    // identity the Phrase itself is known by.
    entryId: { ...phrase.entryId, uuid: phrase.uuid.value },
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
