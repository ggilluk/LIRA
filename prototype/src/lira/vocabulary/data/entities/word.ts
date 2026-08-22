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
 * (`word.hypernyms(relationships, dictionary)`, ...) have no counterpart
 * here any more -- retired along with LexicalRelationshipStore's own
 * retirement from the permanent queryable model (this file's own
 * "Derived properties" section, further down, on exactly why and what
 * replaced each one). */

import type { Code, Identifier, Number_, Text } from "../../../value_objects";
import type { LinguisticUnit } from "../../../linguistics/data/linguistic_unit";
import type { EditorialLabel } from "../enums/editorial_label";
import type { HolonymRootWord } from "../enums/holonym_root_word";
import type { HypernymRootWord } from "../enums/hypernym_root_word";
import type { InterrogativeRootWord } from "../enums/interrogative_root_word";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { Pronunciation } from "../pronunciation";
import type { RegisterCode } from "../enums/register_code";
import type { SourceReference } from "../source_reference";
import type { VectorPrimitiveRootWord } from "../enums/vector_primitive_root_word";

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

  // The Princeton WordNet 3.1 synset naming this Word's own *primary*
  // sense, when known ("00001740-n" -- an 8-digit zero-padded byte
  // offset, a hyphen, then the synset's ss_type letter: n/v/a/s/r).
  // Registered at creation time (whichever synset first produced this
  // Word -- a Word is unique by (partOfSpeech, lemma), not by synset,
  // WordSeeder.seedWordNet's own find-or-create, role/word_seeder.ts, so
  // a polysemous lemma's Word goes on to lexicalize several more synsets
  // after this one, each added to `senseIds` below), then updated once
  // more by WordSeeder.seedWordNet's own orderSensesByFrequency, once
  // that Word's full senseIds list is known, to instead name whichever
  // Sense turned out to have the highest Sense.senseFrequency (that
  // field's own docstring, data/sense.ts) -- the two coincide whenever
  // the first-seeded sense also happens to be the most frequent one, the
  // ordinary case, but not always. This field stays as a "primary sense"
  // snapshot for the callers that only ever needed one representative
  // synset id (DictionaryView's own WordRecord.sense_id, the Hierarchy
  // tree's node-id fallback) -- it is never a complete picture of every
  // synset this Word now belongs to; `senseIds` is. Undefined for a
  // Word that didn't come from WordSeeder.seedWordNet.
  synsetId?: Identifier;

  // Every Sense (data/sense.ts) this Word lexicalizes, each entry that
  // Sense's own `uuid` -- an internal graph reference, not a WordNet
  // identifier string (synsetId above is that; sense.ts's own docstring
  // on why the two are easy to conflate but distinct: synsetId is
  // "which WordNet synset", a senseIds entry is "which Sense object in
  // this Domain's own Senses"). More than one entry is the ordinary
  // case for a polysemous lemma, not an edge case --
  // Senses.registerMember() appends here (idempotently) once per synset
  // this Word's own (partOfSpeech, lemma) turns out to lexicalize, in
  // whatever order pass 1 happened to visit each synset in; WordSeeder.seedWordNet's
  // own orderSensesByFrequency then reorders the whole list by
  // descending Sense.senseFrequency once it's known in full, so
  // `senseIds[0]` ends up the highest-frequency Sense -- real usage
  // centrality, not an accident of seeding order -- and always the same
  // Sense `synsetId` above names (that field's own docstring on how the
  // two stay in sync). Deliberately additive alongside every field below
  // it still duplicates from a Sense (definition, usageNotes, domainTag,
  // relatedDomainTags) -- Sense's own docstring on why removing that
  // duplication is separate, later work; a Word with several senses
  // duplicates only its *first* (highest-frequency) Sense's copy of
  // those fields, the same "primary sense" simplification synsetId above
  // already accepts. Empty for a Word that didn't come from
  // WordSeeder.seedWordNet.
  senseIds: readonly Identifier[];

  version: Text;
  languageCode: Code;
  lexicalForm?: Text;
  normalisedForm?: Text;
  // The purpose is to identify the standard dictionary form used to
  // represent the word -- the one row of the Word Form to Part of
  // Speech Matrix (data/matrices/word_form_part_of_speech_matrix.md) ticked for
  // every part of speech without exception, so it lives here on Word
  // itself rather than being repeated on every one of its POS-specific
  // subtypes (Noun, Verb, Adjective, Adverb, Pronoun, ...). Distinct
  // from `lexicalForm`/`text` above in name only for a base entry (they
  // agree); the difference matters for an inflected form's own Word
  // (e.g. "ran"), where this names its lemma ("run") rather than its
  // own spelling -- undefined until a caller populates it, the same as
  // every other *_Form field the matrix's own subtype fields carry.
  // Fully lexical, not spelling-derivable at all (the matrix's own
  // Format/String Pattern columns are both `N/A` for this row) -- a
  // populated value's own `Text.formats` (value_objects/data/text.ts)
  // should stay unset here, unlike a regular-case *_Form value below.
  baseLemmaCanonicalForm?: Text;
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

  // True only for one of the 25 words seeded from
  // assets/common/en/root_words.json -- the Interrogative/Hypernym/
  // Holonym/Vector-Primitive root word table (data/enums/interrogative_root_word.ts's
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

  // Every closed-class component Word this contracted form spells --
  // "don't" <- ["do", "not"], "it's" <- ["it", "is"/"has", ambiguous
  // without context] -- read back from WordSeeder's own seeding-time-only
  // LexicalRelationship graph (VocabularyContext's own docstring, data/vocabulary_context.ts,
  // on why nothing outside a seeder reads that graph directly any more)
  // rather than left as a queryable CONTRACTION edge. Word-level, not a
  // POS-subtype field, since a contraction's own components span
  // whatever closed-class parts of speech happen to combine (pronoun +
  // auxiliary verb, negation particle, modal, ...), never one single POS
  // the way a derivation pair's own fields are scoped. Many-to-many, not
  // a single pointer -- CONTRACTION is the only Orthographic-group kind
  // with any real seeded data at all today (the Common Vocabulary
  // Relationship Cache's own orthographic_relationships.json, 16
  // entries; every other Orthographic kind -- SPELLING_VARIANT,
  // ABBREVIATION, ACRONYM, ... -- carries zero real data anywhere in
  // this codebase, so no attribute field is built for those yet; add one
  // if and when real data exists to populate it, rather than
  // speculatively now). Deliberately one-directional -- a component
  // word's own reverse index of every contraction it participates in
  // isn't built here; nothing reads it, and it can be added later
  // without touching this field. Always [] for a Word this fact doesn't
  // apply to (every non-contraction, and any contraction predating this
  // field's own seeding pass).
  contractionOf: readonly Identifier[];

  // Every WordForm (data/word_form.ts) registered against this Word --
  // one per inflected spelling that carries its own addressable
  // identity and its own Senses, `senseIds`'s own exact counterpart one
  // level down. AUXILIARY-only today (role/auxiliary_seeder.ts is the
  // only writer, via WordForms.registerMember()) -- every other POS
  // subtype still spells its own inflected forms as scalar `*_Form`
  // fields on its own subtype interface (data/pos_form_fields.ts),
  // untouched; WordForm's own docstring has the full reasoning for why
  // only Auxiliary moved. Always [] for a Word this fact doesn't apply
  // to, `contractionOf`'s own exact convention.
  formIds: readonly Identifier[];
}
