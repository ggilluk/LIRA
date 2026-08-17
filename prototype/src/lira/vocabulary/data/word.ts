/** Word: one lexical form in one language and one grammatical category
 * (Vocabulary Layer developer specification, 4). Still shaped like
 * Linguistics's LinguisticUnit -- Word has two legitimate uses, the
 * *type* (a lexical entry, owned by Vocabulary) and the *token* (one
 * occurrence of that type in a sentence, participating in Linguistics's
 * tree via LinguisticUnit's `text` and `systemProperty`); this is
 * deliberate, not an unresolved layering error (see
 * vocabulary/documentation/README.md, 4.1).
 *
 * Word has no `systemProperties` field of its own (Design Principle 8
 * -- tensor-backed system properties belong to a claimed
 * LexicalRelationship between two words, not to a word standing alone).
 *
 * Ported from vocabulary/data/word.py. Python's `@dataclass` with
 * `kw_only` fields and `__post_init__` becomes a plain `Word` data
 * interface plus a `createWord()` factory applying the same defaults
 * and post-init normalisation. Python's bound derived-property methods
 * (`word.hypernyms(relationships, dictionary)`, ...) become free
 * functions of the same name taking `word` as their first argument --
 * idiomatic TS, same behaviour, same call-site shape read right to
 * left instead of left to right. */

import type { Code, Identifier, Number_, Text } from "../../value_objects";
import type { LinguisticUnit } from "../../linguistics/data/linguistic_unit";
import type { Dictionary } from "./dictionary";
import type { DefinitionWordReference } from "./definition_word_reference";
import type { EditorialLabel } from "./editorial_label";
import type { HolonymRootWord } from "./holonym_root_word";
import type { HypernymRootWord } from "./hypernym_root_word";
import type { InterrogativeRootWord } from "./interrogative_root_word";
import { LexicalRelationshipStore } from "./lexical_relationship_store";
import { LexicalRelationshipType } from "./lexical_relationship_type";
import { PartOfSpeech } from "./part_of_speech";
import type { Pronunciation } from "./pronunciation";
import type { RegisterCode } from "./register_code";
import type { SourceReference } from "./source_reference";
import type { VectorPrimitiveRootWord } from "./vector_primitive_root_word";
import { newUuid } from "./uuid";
import { phraseAsWord, type Phrase } from "./phrase";
import type { PhraseBook } from "./phrase_book";

// Splits a definition's prose into its own word tokens -- deliberately a
// local regex, not a Linguistics-Layer LinguisticLexer import: Vocabulary
// must not depend on Linguistics (Linguistics depends on Vocabulary, via
// Word), and definitionWords() only needs "the words in this string",
// not sentence/grammar structure. Same pattern as
// external_dictionary_adapter.ts's wordTerms().
const DEFINITION_WORD_PATTERN = /[^\W_]+/g;

function definitionTokens(definitionText: string): string[] {
  return definitionText.replace(/-/g, " ").match(DEFINITION_WORD_PATTERN) ?? [];
}

export interface Word extends LinguisticUnit {
  partOfSpeech: PartOfSpeech;

  uuid: Identifier;

  // The persistent Qualified Word Identity (Domain + Lexical Form +
  // partOfSpeech) -- distinct from `uuid` above, which is deliberately
  // NOT stable: `uuid` is a per-Domain-graph-instance identity, freshly
  // regenerated every time a Word is copied into a Domain's own
  // Dictionary (Dictionary.seedFrom, WordSeeder.seedClosedClassWords),
  // so that two Domains' independent copies of "be" are never confused
  // as the same graph node. `entryId` is the opposite: assigned once,
  // when a Word is first authored (an asset-file entry, a promotion, a
  // hydration, or a conflict-resolution registration), stored in the
  // Common Vocabulary Cache's asset JSON for every entry that lives
  // there, and left untouched by every later copy -- the same
  // underlying vocabulary entry keeps the same entryId no matter how
  // many Domains end up holding their own runtime copy of it.
  entryId: Identifier;

  // The Princeton WordNet 3.1 synset this Word corresponds to, when
  // known ("00001740-n" -- an 8-digit zero-padded byte offset, a
  // hyphen, then the synset's ss_type letter: n/v/a/s/r). A WordNet
  // synset -- literally "a set of one or more synonyms" -- IS a LIRA
  // Domain+Word: both name one sense, not one spelling, which is why
  // LIRA models a WordNet synset as a set of Words joined by SYNONYM
  // LexicalRelationships (word.ts's own synonyms()) rather than as a
  // separate concept of its own -- synsetId is just that sense's
  // upstream WordNet identity carried along, the same role entryId
  // plays for the Common Vocabulary Cache. Undefined for a Word that
  // didn't come from WordSeeder.seedWordNet (role/word_seeder.ts).
  synsetId?: Identifier;

  // A reference to the Sense (data/sense.ts) this Word lexicalizes --
  // that Sense's own `uuid`, an internal graph reference, not a WordNet
  // identifier string (synsetId above is that; sense.ts's own docstring
  // on why the two are easy to conflate but distinct: synsetId is
  // "which WordNet synset", senseId is "which Sense object in this
  // Domain's own SenseStore"). Deliberately additive alongside every
  // field below it still duplicates from that Sense (definition,
  // usageNotes, domainTag, relatedDomainTags) -- Sense's own docstring
  // on why removing that duplication is separate, later work. Undefined
  // for a Word that didn't come from WordSeeder.seedWordNet.
  senseId?: Identifier;

  version: Text;
  languageCode: Code;
  lexicalForm?: Text;
  normalisedForm?: Text;
  scriptCode?: Code;
  pronunciations: readonly Pronunciation[];
  syllableRepresentation?: Text;
  syllableCount?: Number_;
  stressPattern?: Text;
  gloss?: Text;
  definition?: Text;
  usageNotes: readonly Text[];
  registerCodes: readonly RegisterCode[];
  dialectCodes: readonly Code[];
  frequencyValue?: Number_;
  frequencyScale?: Code;
  etymologyText?: Text;
  firstRecordedUse?: Text;
  editorialLabels: readonly EditorialLabel[];
  sourceReferences: readonly SourceReference[];

  // True only for a Word loaded from the English Common Vocabulary
  // Cache (or another language's equivalent) by WordSeeder -- never
  // set true by hand. See vocabulary/documentation/README.md, 9.5.
  isCommon: boolean;

  // Only ever set on a Common Vocabulary Cache entry, and only when its
  // (lexicalForm, partOfSpeech) pair is shared with another entry --
  // true dictionary polysemy, as opposed to a homograph (same spelling,
  // different partOfSpeech, already told apart by partOfSpeech alone).
  // undefined means the plain "common" domain; a value like
  // "symbol.common" names this sense's own HYPERNYM as a subdomain of
  // "common" -- see Word.domainTag's Python docstring for the full
  // rationale (vocabulary/data/word.py).
  domainTag?: Text;

  // A WordNet-only sibling of domainTag, populated by WordSeeder.seedWordNet
  // from a synset's own topic-domain pointers (`;c`/`-c` in the raw dict
  // files -- word_seeder.ts's relationshipKindForPointer used to turn
  // these into TOPIC_DOMAIN LexicalRelationship edges; it no longer does).
  // A word sense can belong to at most one topic domain via domainTag
  // itself (the first topic pointer WordSeeder encounters for that sense
  // -- e.g. "winger" -> domainTag "soccer"), with every *additional*
  // topic this same sense is also tagged with in WordNet (a sense can
  // legitimately carry several -- "winger" is also a wing position in
  // hockey, rugby, and field_hockey) recorded here instead, so none are
  // silently dropped. Always empty for a Common Vocabulary Cache entry
  // (domainTag's own polysemy use never populates this) and for a
  // WordNet sense with zero or one topic pointer -- the common case.
  relatedDomainTags: readonly Text[];

  // Implementation plumbing, not part of the documented field set:
  // tracks whether AsyncDictionaryHydrator has finished populating this
  // Word's meaning/partOfSpeech from the external dictionary API yet.
  isFullyHydrated: boolean;

  // Seeded Attributes: this Word's approximate, hand/heuristically
  // assigned position in the PAD (Pleasure-Arousal-Dominance) affective
  // space (Mehrabian & Russell). undefined means no PAD value has been
  // assigned yet, not "neutral" (0.0 is the seeded value for a
  // genuinely neutral word).
  seededPleasureDispleasureWeight?: Number_;
  seededArousalNonArousalWeight?: Number_;
  seededDominanceSubmissiveWeight?: Number_;

  // True only for one of the 25 words seeded from
  // assets/common/en/root_words.json -- the Interrogative/Hypernym/
  // Holonym/Vector-Primitive root word table (data/interrogative_root_word.ts's
  // own docstring). Never set true by hand elsewhere; every other Word
  // defaults to false via createWord(). See DictionaryView's own "Show
  // root words" filter, the reason this flag exists at all rather than
  // being inferred from whichever of the four fields below is set.
  isRootWord: boolean;

  // At most one of these four is ever set, and only when isRootWord is
  // true -- whichever single column of the root word table this Word
  // instantiates (e.g. the Word "entity" carries hypernymRootWord =
  // HypernymRootWord.ENTITY, and none of the other three). All four
  // enums share the same numeric ordinal for the same table row (see
  // each one's own docstring), so a caller holding one root word's
  // column value can look up its counterpart in another column by
  // ordinal alone, without this Word needing to store all four itself.
  interrogativeRootWord?: InterrogativeRootWord;
  hypernymRootWord?: HypernymRootWord;
  holonymRootWord?: HolonymRootWord;
  vectorPrimitiveRootWord?: VectorPrimitiveRootWord;

  // True for a NOUN Word that can be considered derived from (or shares
  // its lexical form with) a corresponding VERB sense -- a suffix-
  // derived nominalisation ("operate" -> "operation", "manifest" ->
  // "manifestation", "originate" -> "origination") or a genuine
  // zero-derivation noun/verb pair ("work", "trigger"). Defaults false
  // via createWord(); never set true by hand outside WordSeeder's own
  // entryToWord(). Not itself a LexicalRelationship -- this only flags
  // that the Word's own NOUN sense is a derivable one, it doesn't wire
  // the actual NOMINALISATION edge to the verb (see
  // relationships/morphological_relationships.json for that, where one
  // already exists).
  isDerivableNoun: boolean;
}

export type WordInit = Pick<Word, "text" | "partOfSpeech"> & Partial<Omit<Word, "text" | "partOfSpeech">>;

export function createWord(init: WordInit): Word {
  const word: Word = {
    pronunciations: [],
    usageNotes: [],
    registerCodes: [],
    dialectCodes: [],
    editorialLabels: [],
    relatedDomainTags: [],
    sourceReferences: [],
    isCommon: false,
    isFullyHydrated: true,
    isRootWord: false,
    isDerivableNoun: false,
    uuid: init.uuid ?? { value: newUuid() },
    entryId: init.entryId ?? { value: newUuid() },
    version: init.version ?? { value: "1.0" },
    languageCode: init.languageCode ?? { value: "en" },
    ...init,
  };
  if (word.lexicalForm === undefined) word.lexicalForm = { value: word.text };
  if (word.normalisedForm === undefined) word.normalisedForm = { value: word.text.toLowerCase() };
  return word;
}

/** A shallow copy of `word`, sharing every field's own object identity
 * except `uuid`, which becomes a fresh Identifier -- the same shape as
 * Python's `copy.copy(word)` followed by a `uuid` reassignment, used by
 * Dictionary.seedFrom and WordSeeder.seedClosedClassWords/loadCache. */
export function copyWordWithFreshUuid(word: Word): Word {
  return { ...word, uuid: { value: newUuid() } };
}

// -- Derived properties (4.3) --------------------------------------
// None of these are stored fields. Each is computed on demand from a
// LexicalRelationshipStore (this Word's relationships) and a
// Dictionary (to resolve the other word in each relationship).

interface RelatedWordsOptions {
  relationshipType?: LexicalRelationshipType;
  group?: number;
  category?: number;
  direction?: "outgoing" | "incoming" | "both";
}

function relationshipMatches(
  relationship: { relationshipType: LexicalRelationshipType },
  relationshipType?: LexicalRelationshipType,
  group?: number,
  category?: number,
): boolean {
  if (relationshipType !== undefined) return relationship.relationshipType === relationshipType;
  if (category !== undefined) {
    return (
      groupOf(relationship.relationshipType) === group && categoryOf(relationship.relationshipType) === category
    );
  }
  if (group !== undefined) return groupOf(relationship.relationshipType) === group;
  return true;
}

function groupOf(kind: LexicalRelationshipType): number {
  return kind >> 6;
}

function categoryOf(kind: LexicalRelationshipType): number {
  return (kind >> 3) & 0b111;
}

/** Returns the distinct set of related Words, in first-seen order --
 * not one entry per matching relationship. Two different edges can
 * legitimately point at the same other Word (e.g. "her" is both the
 * object form and the possessive-determiner form of "she"), and a
 * reciprocal pair (SYNONYM/ANTONYM, materialised in both directions) is
 * visible as both an outgoing and an incoming match under
 * direction="both". Either way, a caller asking "what Words is this
 * related to" wants each Word once.
 *
 * `word` itself may be a Phrase, not just a Word -- a WordNet-seeded
 * multi-word synset member (WordSeeder.seedWordNet) sits in the exact
 * same LexicalRelationshipStore graph a Word does (its own uuid is
 * just another relationship endpoint), so it can ask for its own
 * hypernyms/synonyms/etc. exactly the way a Word can. The *other* side
 * of a relationship can be a Phrase too; `phraseBook`, if given, is
 * consulted only after `dictionary.findByUuid` has already failed --
 * every caller that never touches Phrase-participating data keeps
 * working unchanged by simply omitting it, since Dictionary alone
 * resolves every pre-Phrase-seeding relationship graph exactly as
 * before. A resolved Phrase is projected onto a Word-shaped view via
 * phraseAsWord() (phrase.ts), preserving its own uuid, so a caller
 * never needs to tell "this came from Dictionary" and "this came from
 * PhraseBook" apart. */
function relatedWords(
  word: Word | Phrase,
  relationships: LexicalRelationshipStore,
  dictionary: Dictionary,
  options: RelatedWordsOptions = {},
  phraseBook?: PhraseBook,
): readonly Word[] {
  const { relationshipType, group, category, direction = "outgoing" } = options;
  const myId = word.uuid.value;
  const otherIds: string[] = [];
  if (direction === "outgoing" || direction === "both") {
    for (const r of relationships.outgoing(myId)) {
      if (relationshipMatches(r, relationshipType, group, category)) otherIds.push(r.targetWordId.value);
    }
  }
  if (direction === "incoming" || direction === "both") {
    for (const r of relationships.incoming(myId)) {
      if (relationshipMatches(r, relationshipType, group, category)) otherIds.push(r.sourceWordId.value);
    }
  }
  const seenIds = new Set<string>();
  const resolved: Word[] = [];
  for (const wordId of otherIds) {
    if (seenIds.has(wordId)) continue;
    seenIds.add(wordId);
    const other = dictionary.findByUuid(wordId) ?? (phraseBook && phraseBook.findByUuid(wordId) ? phraseAsWord(phraseBook.findByUuid(wordId)!) : undefined);
    if (other !== undefined) resolved.push(other);
  }
  return resolved;
}

export function lemmaForms(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.LEMMA_FORM }, phraseBook);
}

/** Every Word that names `word` as its LEMMA_FORM -- the inverse
 * direction of lemmaForms(), read via LEMMA_FORM's own incoming edges
 * rather than a separately-seeded INFLECTION edge. */
export function inflections(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, {
    relationshipType: LexicalRelationshipType.LEMMA_FORM,
    direction: "incoming",
  }, phraseBook);
}

export function morphologicalVariants(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { group: 0 }, phraseBook);
}

export function derivedForms(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { group: 0, category: 6 }, phraseBook);
}

export function synonyms(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.SYNONYM, direction: "both" }, phraseBook);
}

export function antonyms(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.ANTONYM, direction: "both" }, phraseBook);
}

export function hypernyms(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.HYPERNYM }, phraseBook);
}

// A HYPONYM edge is never actually stored by WordSeeder.seedWordNet --
// that class's own relationshipKindForPointer canonicalizes WordNet's
// `~` (hyponym) pointer onto the same HYPERNYM kind as its `@`
// counterpart, swapped, rather than creating a second, fully redundant
// edge for the identical fact (that function's own docstring). A
// word's hyponyms are exactly the other Words with an *incoming*
// HYPERNYM edge to it -- symmetric with hypernyms() itself reading the
// *outgoing* side of that same kind.
export function hyponyms(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.HYPERNYM, direction: "incoming" }, phraseBook);
}

export function meronyms(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.MERONYM, direction: "incoming" }, phraseBook);
}

export function holonyms(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.HOLONYM, direction: "incoming" }, phraseBook);
}

// Same fate as HYPONYM (hyponyms()'s own docstring): a TROPONYM edge is
// never actually stored either -- verb-specific hyponymy canonicalizes
// onto the identical HYPERNYM kind regardless of part of speech. The
// verb-specific subset troponyms() promises is recovered by filtering
// hyponyms() itself down to VERB Words, rather than a separately
// stored fact.
export function troponyms(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return hyponyms(word, relationships, dictionary, phraseBook).filter((other) => other.partOfSpeech === PartOfSpeech.VERB);
}

export function spellingVariants(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { group: 2, category: 0, direction: "both" }, phraseBook);
}

export function abbreviations(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.ABBREVIATION }, phraseBook);
}

export function acronyms(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.ACRONYM }, phraseBook);
}

export function contractions(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.CONTRACTION }, phraseBook);
}

export function transliterations(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.TRANSLITERATION }, phraseBook);
}

export function relatedWordsOf(word: Word | Phrase, relationships: LexicalRelationshipStore, dictionary: Dictionary, phraseBook?: PhraseBook): readonly Word[] {
  return relatedWords(word, relationships, dictionary, { relationshipType: LexicalRelationshipType.RELATED, direction: "both" }, phraseBook);
}

// -- Definition word breakdown (4.4) ---------------------------------
// Also not a stored field -- computed on demand, like the derived
// properties above -- but resolved directly against a Dictionary
// rather than a LexicalRelationshipStore: a definition is prose about
// this Word, not a claimed relationship between two Words, so there is
// no LexicalRelationship to read.

/** Breaks `word`'s own `definition` text into its own sequenced array
 * of DefinitionWordReferences, one per token in reading order --
 * unlike relatedWords, duplicates are kept and position is preserved,
 * since this describes a sentence, not a set of related Words. Empty
 * when `definition` is undefined.
 *
 * Each token is resolved against `dictionary` domain-first: every
 * same-text candidate `Dictionary.lookupAll` returns, preferring one
 * with `isCommon=false` if any exists, else falling back to
 * lookupAll's own first-seeded order. A token with no candidate at all
 * resolves to `word=undefined`, reported rather than guessed. */
export function definitionWords(word: Word, dictionary: Dictionary): readonly DefinitionWordReference[] {
  if (word.definition === undefined) return [];
  const references: DefinitionWordReference[] = [];
  for (const token of definitionTokens(word.definition.value)) {
    const candidates = dictionary.lookupAll(token);
    const resolved = candidates.length > 0 ? (candidates.find((w) => !w.isCommon) ?? candidates[0]) : undefined;
    references.push({ text: token, word: resolved });
  }
  return references;
}
