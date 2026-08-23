/** Domain-facing resolvers for a Word/Phrase -- its effective Sense-owned
 * fields, its root-word status, and its display domain label. Split out of
 * ui/dictionary_view.ts's own DictionaryView class (formerly the private
 * methods senseFieldsFor/isRootWordFor/domainLabel) into plain exported
 * functions taking their data dependencies (Senses, domainName) as explicit
 * parameters. */

import type { Identifier, Text } from "../../../value_objects";
import type { Phrase } from "../../data/phrase";
import { isNoun } from "../../role/processor/noun_processor";
import type { Senses } from "../../data/senses";
import type { Word } from "../../data/entities/word";
import type { WordForms } from "../../data/word_forms";

/** `entry`'s own primary senseId -- WordForms.senseIdsOf()'s own
 * `[0]` for a Word (Word carries no `senseIds` of its own any more,
 * WordForm's own docstring on why), or the Phrase's own `senseIds[0]`
 * directly (Phrase keeps its own field, untouched by that move). */
function primarySenseId(entry: Word | Phrase, wordForms: WordForms): Identifier | undefined {
  return "words" in entry ? entry.senseIds[0] : wordForms.senseIdsOf(entry)[0];
}

/** The Sense-owned fields that actually apply to `entry` (a Word or a
 * Phrase) -- domainTag/relatedDomainTags, definition/gloss/usageNotes --
 * preferring its own Sense (WordSeeder's own tagTopicDomain, seedWordNet's
 * own createSense call, and registerUniqueSense all populate a Sense with
 * the identical values `entry`'s own fields already carry, WordNet-sourced
 * and hand-curated alike -- sense.ts's own docstring) and falling back to
 * `entry`'s own fields only when its senseId doesn't resolve in this
 * Domain's own Senses. That fallback isn't just defensive: a Phrase copied
 * into a different Domain (VocabularyContext's own Physics-from-Common
 * bootstrap, in particular) doesn't yet carry a matching Sense copy across
 * into that Domain's own Senses -- a known, accepted gap, the same one
 * SemanticRelationshipStore already has for a cross-domain copy -- so a
 * Phrase's own fields (never stripped, unlike WordNet's own domainTag/
 * relatedDomainTags) are what keeps a Physics-side phrase's own definition/
 * domain/etc. correct regardless. A Word has no such fallback fields any
 * more (`definition`/`domainTag`/`relatedDomainTags`/`gloss`/`usageNotes`
 * are all still there except `definition`, Sense's own docstring on the
 * accepted gap this specific field now shares with PAD) -- an
 * un-resolvable Word simply shows no definition until that gap closes,
 * same as PAD already does. */
export function senseFieldsFor(
  senses: Senses,
  entry: Word | Phrase,
  wordForms: WordForms,
): {
  domainTag?: Text;
  relatedDomainTags: readonly Text[];
  definition?: Text;
  gloss?: Text;
  usageNotes: readonly Text[];
} {
  const senseId = primarySenseId(entry, wordForms);
  const sense = senseId !== undefined ? senses.findByUuid(senseId.value) : undefined;
  if (sense !== undefined) {
    return {
      domainTag: sense.domainTag,
      relatedDomainTags: sense.relatedDomainTags,
      definition: sense.definition,
      gloss: sense.gloss,
      usageNotes: sense.usageNotes,
    };
  }
  if ("words" in entry) {
    return {
      domainTag: entry.domainTag,
      relatedDomainTags: entry.relatedDomainTags,
      definition: entry.definition,
      gloss: entry.gloss,
      usageNotes: entry.usageNotes,
    };
  }
  return { domainTag: entry.domainTag, relatedDomainTags: entry.relatedDomainTags, gloss: entry.gloss, usageNotes: entry.usageNotes };
}

/** isRootWord's own exact counterpart to senseFieldsFor() -- kept
 * separate since Phrase has no notion of a root word at all (only one
 * of root_words.json's 25 curated NOUN Words ever has this set), so
 * this only ever takes a Word, not the wider Word | Phrase entry.
 * `isRootWord` itself lives on Noun now, not Word (Noun's own
 * docstring on why) -- `isNoun(word)` narrows before the fallback read,
 * so a non-Noun Word (which never has this fact at all) simply reads
 * false rather than failing to compile. */
export function isRootWordFor(senses: Senses, word: Word, wordForms: WordForms): boolean {
  const senseId = wordForms.senseIdsOf(word)[0];
  const sense = senseId !== undefined ? senses.findByUuid(senseId.value) : undefined;
  return sense?.isRootWord ?? (isNoun(word) && word.isRootWord);
}

export function domainLabel(senses: Senses, domainName: string, word: Word | undefined, wordForms: WordForms): string | null {
  if (word === undefined) return null;
  if (!word.isCommon) return domainName;
  // A genuine polyseme's domainTag ("symbol.common") names its own
  // sense-disambiguating subdomain; every other Common word reads as
  // plain "Common", same as before this field existed.
  return senseFieldsFor(senses, word, wordForms).domainTag?.value ?? "Common";
}
