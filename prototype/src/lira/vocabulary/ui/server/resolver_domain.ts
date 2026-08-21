/** Domain-facing resolvers for a Word/Phrase -- its effective Sense-owned
 * fields, its root-word status, and its display domain label. Split out of
 * ui/dictionary_view.ts's own DictionaryView class (formerly the private
 * methods senseFieldsFor/isRootWordFor/domainLabel) into plain exported
 * functions taking their data dependencies (Senses, domainName) as explicit
 * parameters, the same conversion data/word_forms.ts's own formTextsOf()
 * already uses in this codebase. */

import type { Text } from "../../../value_objects";
import type { Phrase } from "../../data/phrase";
import type { Senses } from "../../data/senses";
import type { Word } from "../../data/word";

/** The Sense-owned fields that actually apply to `entry` (a Word or a
 * Phrase) -- domainTag/relatedDomainTags, definition/gloss/usageNotes --
 * preferring its own Sense (WordSeeder's own tagTopicDomain, seedWordNet's
 * own createSense call, and registerUniqueSense all populate a Sense with
 * the identical values `entry`'s own fields already carry, WordNet-sourced
 * and hand-curated alike -- sense.ts's own docstring) and falling back to
 * `entry`'s own fields only when its senseId doesn't resolve in this
 * Domain's own Senses. That fallback isn't just defensive: a Word/Phrase
 * copied into a different Domain (VocabularyContext's own Physics-from-Common
 * bootstrap, in particular) doesn't yet carry a matching Sense copy across
 * into that Domain's own Senses -- a known, accepted gap, the same one
 * SemanticRelationshipStore already has for a cross-domain copy -- so
 * `entry`'s own fields (never stripped, unlike WordNet's own domainTag/
 * relatedDomainTags) are what keeps a Physics-side word's own definition/
 * domain/etc. correct regardless. */
export function senseFieldsFor(
  senses: Senses,
  entry: Word | Phrase,
): {
  domainTag?: Text;
  relatedDomainTags: readonly Text[];
  definition?: Text;
  gloss?: Text;
  usageNotes: readonly Text[];
} {
  // senseIds[0] -- the primary, highest-Sense.senseFrequency sense
  // (Word.senseIds's own docstring) -- for a polysemous entry, WordRecord/PhraseRecord is
  // still one row, so this picks the one Sense whose fields that row
  // shows; every other sense is reachable via searchSenses() directly.
  const primarySenseId = entry.senseIds[0];
  const sense = primarySenseId !== undefined ? senses.findByUuid(primarySenseId.value) : undefined;
  if (sense !== undefined) {
    return {
      domainTag: sense.domainTag,
      relatedDomainTags: sense.relatedDomainTags,
      definition: sense.definition,
      gloss: sense.gloss,
      usageNotes: sense.usageNotes,
    };
  }
  return {
    domainTag: entry.domainTag,
    relatedDomainTags: entry.relatedDomainTags,
    definition: entry.definition,
    gloss: entry.gloss,
    usageNotes: entry.usageNotes,
  };
}

/** isRootWord's own exact counterpart to senseFieldsFor() -- kept
 * separate since Phrase has no notion of a root word at all (only one
 * of root_words.json's 25 curated NOUN Words ever has this set), so
 * this only ever takes a Word, not the wider Word | Phrase entry. */
export function isRootWordFor(senses: Senses, word: Word): boolean {
  const primarySenseId = word.senseIds[0];
  const sense = primarySenseId !== undefined ? senses.findByUuid(primarySenseId.value) : undefined;
  return sense?.isRootWord ?? word.isRootWord;
}

export function domainLabel(senses: Senses, domainName: string, word: Word | undefined): string | null {
  if (word === undefined) return null;
  if (!word.isCommon) return domainName;
  // A genuine polyseme's domainTag ("symbol.common") names its own
  // sense-disambiguating subdomain; every other Common word reads as
  // plain "Common", same as before this field existed.
  return senseFieldsFor(senses, word).domainTag?.value ?? "Common";
}
