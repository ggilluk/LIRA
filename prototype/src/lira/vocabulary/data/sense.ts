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

import type { Identifier, Text } from "../../value_objects";
import type { HolonymRootWord } from "./holonym_root_word";
import type { HypernymRootWord } from "./hypernym_root_word";
import type { InterrogativeRootWord } from "./interrogative_root_word";
import type { SourceReference } from "./source_reference";
import { newUuid } from "./uuid";
import type { VectorPrimitiveRootWord } from "./vector_primitive_root_word";

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
}

export type SenseInit = Partial<Sense>;

export function createSense(init: SenseInit = {}): Sense {
  return {
    usageNotes: [],
    relatedDomainTags: [],
    sourceReferences: [],
    isCommon: false,
    isRootWord: false,
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
