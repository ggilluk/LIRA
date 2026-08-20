/** Sense: one shared meaning that one or more Words/Phrases lexicalize
 * -- the first-class counterpart to what a WordNet synset already names
 * ("a set of one or more synonyms" -- Word.synsetId's own docstring,
 * word.ts). Every member of a synset used to carry its own independent
 * copy of that synset's definition/examples/topic-domain tags
 * (WordSeeder.seedWordNet's own synsetMemberToWord/synsetMemberToPhrase);
 * a Sense holds that data once, and a Word/Phrase that lexicalizes it
 * carries a `senseId` reference (word.ts's own field of that name)
 * instead of a duplicate copy.
 *
 * Every Word/Phrase gets a Sense now, WordNet-sourced (one per synset,
 * shared by every member) and hand-curated alike (one per entry,
 * word_seeder.ts's own registerUniqueSense -- a deliberate "for now"
 * stopgap, not a claim that hand-curated synonyms now group the way
 * WordNet's do). DictionaryView.senseFieldsFor()/isRootWordFor() are
 * the read side: prefer a Word/Phrase's own Sense, fall back to its own
 * fields only when senseId doesn't resolve in that Domain's own
 * Senses (a cross-Domain copy -- VocabularyLayer's own Physics-
 * from-Common bootstrap -- doesn't carry a matching Sense copy across
 * yet, a known, accepted gap, the same one LexicalRelationshipStore
 * already has). Only domainTag/relatedDomainTags actually stopped being
 * written onto a WordNet-seeded Word/Phrase directly (their own
 * docstring below) -- every other field here (definition/gloss/
 * usageNotes, the root-word fields) is still duplicated onto the Word/
 * Phrase too, everywhere, not just for hand-curated data; collapsing
 * that duplication for good needs the cross-Domain gap above fixed
 * first, so it hasn't been done yet.
 *
 * `synsetId` here plays the same "upstream external identity" role
 * Word.synsetId already does -- not to be confused with a Word/Phrase's
 * own `senseId`, which is an internal graph reference (this Sense's own
 * `uuid`) to *this* object, not a WordNet identifier string. The
 * client-facing `sense_id` field DictionaryView already sends
 * (dictionary_view.ts's own WordRecord/PhraseRecord) is unrelated to
 * either -- it's still populated straight from Word.synsetId, unchanged
 * by this file. */

import type { Identifier, Number_, Text } from "../../value_objects";
import type { HolonymRootWord } from "./enums/holonym_root_word";
import type { HypernymRootWord } from "./enums/hypernym_root_word";
import type { InterrogativeRootWord } from "./enums/interrogative_root_word";
import type { SourceReference } from "./source_reference";
import { newUuid } from "./uuid";
import type { VectorPrimitiveRootWord } from "./enums/vector_primitive_root_word";

export interface Sense {
  // A per-Domain-graph-instance identity, freshly regenerated every
  // time a Sense is copied into a Domain's own Senses
  // (Senses.seedFrom) -- Word.uuid's own exact counterpart, same
  // reasoning.
  uuid: Identifier;

  // Assigned once, when a Sense is first created, and left untouched by
  // every later copy -- Word.entryId's own exact counterpart.
  entryId: Identifier;

  // The Princeton WordNet 3.1 synset this Sense corresponds to, when
  // known -- Word.synsetId's own exact counterpart (same format: an
  // 8-digit zero-padded byte offset, a hyphen, then the synset's
  // ss_type letter). Undefined for a Sense that didn't come from
  // WordSeeder.seedWordNet -- there is no other source of Senses yet.
  synsetId?: Identifier;

  gloss?: Text;
  definition?: Text;
  usageNotes: readonly Text[];

  // How often this Sense's own meaning was tagged in Princeton
  // WordNet's semantic concordance corpus (SemCor) -- a genuine
  // frequency count, not a qualitative tag. Word senses aren't equally
  // common: of every occurrence of "bank", most name one particular
  // meaning far more often than its others, and this is that evidence,
  // sourced from WordNet's own bundled dict/index.sense file (one line
  // per lemma's own sense_key/synset_offset/sense_number/tag_cnt;
  // WordNetSynset.senseFrequency's own docstring, role/wordnet_loader.ts).
  // Summed across every lemma that lexicalizes this Sense's own
  // synsetId, not any one lemma's own count alone -- WordNet's raw data
  // is inherently per-lemma ("bank" and "banking_concern" get separate
  // tag_cnt entries even where they lexicalize the identical synset),
  // and a Sense is the one shared object standing in for the meaning
  // itself, not for any single lemma that spells it (this interface's
  // own docstring). WordSeeder.seedWordNet's own post-seeding pass uses
  // this to order every polysemous Word/Phrase's own senseIds by real
  // usage centrality (Word.senseIds's own docstring), highest first,
  // rather than by incidental seeding order.
  //
  // 0, not undefined, for a Sense WordNet itself never tagged at all in
  // the concordance -- a common, real outcome (most senses of most
  // words have zero tagged occurrences), not a parsing gap; undefined
  // only for a Sense that didn't come from WordSeeder.seedWordNet in the
  // first place, mirroring synsetId's own "undefined means no WordNet
  // source" convention.
  senseFrequency?: number;

  // Word.domainTag/Word.relatedDomainTags's own exact counterparts --
  // populated by WordSeeder.seedWordNet's own tagTopicDomain for a
  // synset-wide topic-domain pointer (`;c`/`-c`), once per Sense rather
  // than once per member Word/Phrase (word_seeder.ts's own
  // applyDomainTag docstring on why: a topic domain is a property of
  // the meaning, not of any one lemma that happens to spell it), and by
  // registerUniqueSense for a hand-curated entry (copied straight from
  // the Word/Phrase's own value). A WordNet-seeded Word/Phrase's own
  // domainTag/relatedDomainTags go unpopulated now -- this Sense is the
  // only place that fact lives; a hand-curated one keeps its own fields
  // too, since it's cheap and there's no accumulation risk the way
  // tagTopicDomain's repeated per-pointer writes had. Either way,
  // DictionaryView.senseFieldsFor() reads through the Sense first,
  // falling back to the Word/Phrase's own fields only when its senseId
  // doesn't resolve.
  domainTag?: Text;
  relatedDomainTags: readonly Text[];

  sourceReferences: readonly SourceReference[];

  // True only for a Sense loaded by WordSeeder -- never set true by
  // hand. Mirrors Word.isCommon/Phrase.isCommon exactly.
  isCommon: boolean;

  // Word.isRootWord/interrogativeRootWord/hypernymRootWord/
  // holonymRootWord/vectorPrimitiveRootWord's own exact counterparts --
  // Phrase has no equivalent (root_words.json's own 25 entries are all
  // single-word NOUNs), so DictionaryView.isRootWordFor() only ever
  // takes a Word, never the wider Word | Phrase senseFieldsFor() does.
  // "Which sense is the root-word one" is unambiguous here in practice
  // (every root_words.json entry gets its own private, unshared Sense --
  // registerUniqueSense's own docstring), unlike leaving isRootWord on
  // the whole Word, which would wrongly flag every sense of a Word that
  // happened to also carry unrelated meanings.
  isRootWord: boolean;
  interrogativeRootWord?: InterrogativeRootWord;
  hypernymRootWord?: HypernymRootWord;
  holonymRootWord?: HolonymRootWord;
  vectorPrimitiveRootWord?: VectorPrimitiveRootWord;

  // Seeded Attributes: this Sense's own approximate, hand/heuristically
  // assigned position in the PAD (Pleasure-Arousal-Dominance) affective
  // space (Mehrabian & Russell) -- previously Word's own field (moved
  // here since affect is a fact about the *meaning*, the same reasoning
  // domainTag/relatedDomainTags above already moved on: "quick" the
  // adjective and "quick" a hypothetical distinct sense sharing that
  // spelling could carry genuinely different affect, the way any two
  // unrelated meanings can). Populated only for a hand-curated Common
  // Vocabulary Cache entry (WordSeeder.seedWordNet's own registerUniqueSense,
  // role/word_seeder.ts, reading the source word file's own
  // seeded_pleasure_displeasure_weight/seeded_arousal_non_arousal_weight/
  // seeded_dominance_submissive_weight) -- undefined for every WordNet-
  // seeded Sense, the same "no PAD value assigned yet" reading these
  // fields already had on Word (0.0 is the seeded value for a genuinely
  // neutral word, not "unset"). Unlike domainTag/relatedDomainTags,
  // there is no Word/Phrase-level fallback field any more -- a Word/
  // Phrase copied into a different Domain without its own Sense copy
  // (senseFieldsFor()'s own docstring, ui/dictionary_view.ts, on that
  // known cross-Domain gap) simply shows no PAD value there until that
  // gap is closed, rather than carrying a second, duplicated copy.
  seededPleasureDispleasureWeight?: Number_;
  seededArousalNonArousalWeight?: Number_;
  seededDominanceSubmissiveWeight?: Number_;

  // WordNet's own "pertainym" pointer (`\`) -- an adjective's relational
  // noun base ("presidential" pertains to "president") or a manner
  // adverb's adjective base ("quickly" pertains to "quick"). Lives here,
  // on Sense, rather than on Word/Adjective/Adverb the way
  // isNominalised/isAdjectivised/isAdverbialised/isDerivedFromVerb/
  // isDerivedFromAdjective do (data/noun.ts's own docstring on those) --
  // because unlike every one of those, a Pertainym target genuinely
  // differs from one sense of a polysemous word to another, verified
  // directly against the bundled dict/ files: "aural" sense 1
  // ("relating to or characterized by an aura") pertains to the noun
  // "aura", while its sense 2 ("of or pertaining to hearing or the
  // ear") pertains to the unrelated noun "ear" -- 572 of the 656
  // lemmas carrying a Pertainym pointer on two or more of their own
  // senses show this same per-sense divergence, not a rare exception. A
  // Word-level field would have to arbitrarily collapse onto one target
  // and be silently wrong for every other sense that also carries one.
  //
  // A list, not a single Identifier, because a small minority of senses
  // (142 of the 6,168 that carry any Pertainym pointer at all, verified
  // directly) genuinely pertain to more than one target from the
  // identical sense -- "mellowness" pertains to three distinct senses
  // of "mellow" at once. Populated by WordSeeder.seedWordNet's own
  // applyPertainym (role/word_seeder.ts) as it processes each `\`
  // pointer directly, one sense at a time -- unlike
  // deriveMorphologicalPointers()'s own read-back-after-the-fact
  // approach for the Word-level fields above, this never goes through
  // a LexicalRelationship edge at all (the same "write straight onto
  // the Sense, don't create an edge" treatment `;c`/`-c` topic-domain
  // pointers already get, tagTopicDomain's own docstring) -- a
  // Pertainym fact is always word-specific (source/target index never
  // 0000 in the bundled data, confirmed directly), so there is no
  // synset-wide edge shape for it to fall back to the way a Lexical
  // Semantic kind's group-1 branch does. Undefined/empty for a
  // hand-curated Common Vocabulary Cache Sense, which carries no
  // Pertainym data of its own yet.
  pertainsTo: readonly Identifier[];
  pertainsToIndicator: boolean;
}

export type SenseInit = Partial<Sense>;

export function createSense(init: SenseInit = {}): Sense {
  return {
    usageNotes: [],
    relatedDomainTags: [],
    sourceReferences: [],
    isCommon: false,
    isRootWord: false,
    pertainsTo: [],
    pertainsToIndicator: false,
    uuid: init.uuid ?? { value: newUuid() },
    entryId: init.entryId ?? { value: newUuid() },
    ...init,
  };
}

/** A shallow copy of `sense`, sharing every field's own object identity
 * except `uuid`, which becomes a fresh Identifier -- copyWordWithFreshUuid's
 * own exact counterpart (word.ts), used by Senses.seedFrom for the
 * same reason: two Domains' independent copies of the same sense must
 * never be confused as the same graph node. */
export function copySenseWithFreshUuid(sense: Sense): Sense {
  return { ...sense, uuid: { value: newUuid() } };
}
