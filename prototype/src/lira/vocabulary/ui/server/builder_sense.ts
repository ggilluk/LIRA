/** Sense's own client-facing record and query surface -- split out of
 * ui/dictionary_view.ts's own DictionaryView class (formerly the private
 * method senseRecordFor and the public method searchSenses). */

import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Sense } from "../../data/entities/sense";
import type { Senses } from "../../data/senses";

// Sense's own client-facing record -- the Senses tab's own row shape.
// Unlike WordRecord/PhraseRecord, a Sense has no `lexical_form` of its
// own to sort/search by (Sense's own docstring, data/entities/sense.ts, on why
// it's the meaning, not any one spelling of it) -- `lexical_form` here
// is instead every member's own lexical form joined together ("big,
// large"), the Senses tab's own headline column, built fresh each call
// from SenseStore.membersOf() rather than stored on Sense itself.
// `pos` is similarly derived from the first member (every WordNet
// synset is single-part-of-speech by construction; a hand-curated
// Sense has exactly one member anyway, registerUniqueSense's own
// docstring, word_seeder.ts) -- null only for the pathological case of
// a Sense with no registered members at all.
export interface SenseRecord {
  id: string;
  entry_id: string;
  synset_id: string | null;
  lexical_form: string;
  pos: string | null;
  gloss: string;
  definition: string;
  is_common: boolean;
  is_root_word: boolean;
  domain: string | null;
  related_domains: string[];
  member_count: number;
  members: string[];
  sources: string[];
  // Sense.senseFrequency's own docstring (data/entities/sense.ts) --
  // WordSenseSummary.frequency's own exact counterpart for the Senses
  // tab's own row shape, same null-vs-0 distinction.
  sense_frequency: number | null;
}

/** One Sense's full SenseRecord, including its own membership
 * (`members`/`member_count`/`pos`, resolved via SenseStore.membersOf()) --
 * unlike wordRecordFor()/phraseRecordFor(), this reads every field
 * straight off `sense` itself rather than through senseFieldsFor(),
 * since a Sense already *is* the thing senseFieldsFor() resolves a
 * Word/Phrase through. */
export function senseRecordFor(sense: Sense, senses: Senses, domainName: string): SenseRecord {
  const members = senses.membersOf(sense.uuid.value);
  const domain = !sense.isCommon ? domainName : (sense.domainTag?.value ?? "Common");
  return {
    id: sense.uuid.value,
    entry_id: sense.entryId.value,
    synset_id: sense.synsetId?.value ?? null,
    lexical_form: members.map((member) => member.text).join(", "),
    pos: members.length > 0 ? PartOfSpeech[members[0].partOfSpeech] : null,
    gloss: sense.gloss?.value ?? "",
    definition: sense.definition?.value ?? "",
    is_common: sense.isCommon,
    is_root_word: sense.isRootWord,
    domain,
    related_domains: sense.relatedDomainTags.map((tag) => tag.value),
    member_count: members.length,
    members: members.map((member) => member.text),
    sources: sense.sourceReferences.map((ref) => ref.sourceName.value),
    sense_frequency: sense.senseFrequency ?? null,
  };
}

/** phraseRecords()'s own exact counterpart for the Senses tab -- every
 * Sense in this Domain's Senses store, as a SenseRecord, only ever run
 * under MAX_INTERACTIVE_WORDS (render()'s own overCapacitySenses). */
export function senseRecords(senses: Senses, domainName: string): SenseRecord[] {
  const records = senses.all().map((sense) => senseRecordFor(sense, senses, domainName));
  records.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  return records;
}

/** searchPhrases()'s own counterpart for the Senses tab, over
 * MAX_INTERACTIVE_WORDS -- resolves a search against every Sense in
 * this Domain's Senses store directly instead of a pre-embedded
 * client-side array, same reasoning as searchWords()/searchPhrases().
 * `word` matches against the joined-member `lexical_form`
 * (senseRecordFor()'s own docstring on why a Sense has no lexical
 * form of its own); `gloss`/`definition` match the Sense's own fields
 * directly, cheaper to check first since they don't need a
 * SenseStore.membersOf() lookup the way `word`/`pos` do. `senses` is
 * capped at `options.limit`; `totalMatches` is the true, uncapped
 * count. */
export function searchSenses(
  senses: Senses,
  domainName: string,
  options: { word?: string; gloss?: string; definition?: string; pos?: string; limit?: number },
): {
  senses: SenseRecord[];
  totalMatches: number;
} {
  const limit = options.limit ?? 1000;
  const wordQuery = options.word?.trim().toLowerCase();
  const glossQuery = options.gloss?.trim().toLowerCase();
  const definitionQuery = options.definition?.trim().toLowerCase();

  const matches: SenseRecord[] = [];
  let totalMatches = 0;
  for (const sense of senses.all()) {
    if (glossQuery && !(sense.gloss?.value ?? "").toLowerCase().includes(glossQuery)) continue;
    if (definitionQuery && !(sense.definition?.value ?? "").toLowerCase().includes(definitionQuery)) continue;
    const record = senseRecordFor(sense, senses, domainName);
    if (options.pos && record.pos !== options.pos) continue;
    if (wordQuery && !record.lexical_form.toLowerCase().includes(wordQuery)) continue;

    totalMatches += 1;
    if (matches.length < limit) matches.push(record);
  }
  matches.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  return { senses: matches, totalMatches };
}
