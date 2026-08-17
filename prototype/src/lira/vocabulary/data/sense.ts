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
 * Deliberately additive, not yet a replacement: WordSeeder.seedWordNet
 * creates one Sense per synset and links every member to it, but a
 * WordNet-seeded Word/Phrase's own definition/usageNotes/domainTag/
 * relatedDomainTags fields are still populated exactly as before --
 * removing that duplication (and having every reader resolve through
 * the Sense instead) is a separate, later migration, not part of
 * introducing the concept itself.
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
import type { SourceReference } from "./source_reference";
import { newUuid } from "./uuid";

export interface Sense {
  // A per-Domain-graph-instance identity, freshly regenerated every
  // time a Sense is copied into a Domain's own SenseStore
  // (SenseStore.seedFrom) -- Word.uuid's own exact counterpart, same
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
  // present on the interface for symmetry with Word/Phrase, but not yet
  // populated by WordSeeder.seedWordNet (tagTopicDomain still writes
  // directly to each member Word/Phrase, not here); always
  // undefined/empty until a later pass wires topic-domain tagging
  // through the Sense instead.
  domainTag?: Text;
  relatedDomainTags: readonly Text[];

  sourceReferences: readonly SourceReference[];

  // True only for a Sense loaded by WordSeeder -- never set true by
  // hand. Mirrors Word.isCommon/Phrase.isCommon exactly.
  isCommon: boolean;
}

export type SenseInit = Partial<Sense>;

export function createSense(init: SenseInit = {}): Sense {
  return {
    usageNotes: [],
    relatedDomainTags: [],
    sourceReferences: [],
    isCommon: false,
    uuid: init.uuid ?? { value: newUuid() },
    entryId: init.entryId ?? { value: newUuid() },
    ...init,
  };
}

/** A shallow copy of `sense`, sharing every field's own object identity
 * except `uuid`, which becomes a fresh Identifier -- copyWordWithFreshUuid's
 * own exact counterpart (word.ts), used by SenseStore.seedFrom for the
 * same reason: two Domains' independent copies of the same sense must
 * never be confused as the same graph node. */
export function copySenseWithFreshUuid(sense: Sense): Sense {
  return { ...sense, uuid: { value: newUuid() } };
}
