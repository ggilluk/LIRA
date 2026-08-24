/** LexicalRelationship's own client-facing record and query surface --
 * `builder_relationship.ts`'s own exact mirror (that file's own
 * RelationshipRecord/relationshipRecordFor/senseExpandedRelationships/
 * searchRelationships/relationshipKindCounts), one dimension wider:
 * every row also carries the specific WordForm (not just the Sense)
 * each side of the fact is actually about, `LexicalRelationship`'s own
 * `sourceWordFormId`/`targetWordFormId` (data/lexical_relationship.ts's
 * own docstring). `kind`/`group`/`category` read real values off
 * `LexicalRelationshipType`'s own bit-packed group/category structure
 * (relationshipGroup()/relationshipCategory(), data/enums/lexical_relationship_type.ts)
 * -- unlike `relationshipRecordFor()`'s own hardcoded `group: 1`, this
 * enum still has real Morphological/Orthographic groups to report. */

import { LexicalRelationshipType, MERONYM_KIND_QUALIFIER, relationshipCategory, relationshipGroup } from "../../data/enums/lexical_relationship_type";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Dictionary } from "../../data/dictionary";
import type { LexicalRelationship } from "../../data/lexical_relationship";
import type { LexicalRelationshipStore } from "../../data/lexical_relationship_store";
import type { Phrases } from "../../data/phrases";
import type { Senses } from "../../data/senses";
import type { Sense } from "../../data/entities/sense";
import type { Word } from "../../data/entities/word";
import type { WordForms } from "../../data/word_forms";
import { graphUuid } from "../../role/word_form_processor";
import { resolveEntry } from "./resolver_entity";
import { domainLabel } from "./resolver_domain";

export interface LexicalRelationshipRecord {
  id: string;
  source_id: string;
  source_word_form_id: string;
  source_text: string;
  source_pos: string | null;
  source_domain: string | null;
  source_sense_id: string | null;
  source_category: string | null;
  source_gloss: string | null;
  target_id: string;
  target_word_form_id: string;
  target_text: string;
  target_pos: string | null;
  target_domain: string | null;
  target_sense_id: string | null;
  target_category: string | null;
  target_gloss: string | null;
  kind: string;
  group: number;
  category: number;
  confidence: number;
  qualifier: string | null;
  // `builder_relationship.ts`'s own `RelationshipRecord.via_sense_id`
  // docstring applies verbatim here -- which of the *subject*
  // Word/Phrase's own several Senses this row's edge actually came
  // from, so the client can nest it under that Sense's own row inside
  // whichever WordForm group it belongs to (client_senses_section_html.ts's
  // own "Sense.Lexical.Relationships" details).
  via_sense_id: string | null;
}

export interface LexicalRelationshipKindCount {
  kind: string;
  group: number;
  count: number;
}

/** `builder_relationship.ts`'s own `resolveSenseFor()`, verbatim. */
function resolveSenseFor(id: string, dictionary: Dictionary, phrases: Phrases, senses: Senses, wordForms: WordForms): Sense | undefined {
  const direct = senses.findByUuid(id);
  if (direct !== undefined) return direct;
  const entity = resolveEntry(dictionary, phrases, senses, id, wordForms);
  const primarySenseId = entity !== undefined ? wordForms.senseIdsOf(entity)[0]?.value : undefined;
  return primarySenseId !== undefined ? senses.findByUuid(primarySenseId) : undefined;
}

/** One LexicalRelationship's full LexicalRelationshipRecord --
 * `relationshipRecordFor()`'s own exact mirror. `source_text`/`target_text`
 * prefer the specific WordForm's own spelling (`WordForms.findByUuid()`)
 * over `resolveEntry()`'s Word-level fallback -- today the two always
 * agree (every WordForm this store's own writers create is a Word's own
 * base-lemma spelling, `WordForms.registerBaseLemmaForm()`'s own
 * docstring), but reading the WordForm directly is what makes this
 * record correct if a future writer ever creates a LexicalRelationship
 * against a genuinely inflected WordForm instead. */
export function lexicalRelationshipRecordFor(
  rel: LexicalRelationship,
  wordForms: WordForms,
  dictionary: Dictionary,
  phrases: Phrases,
  senses: Senses,
  domainName: string,
): LexicalRelationshipRecord {
  const sourceForm = wordForms.findByUuid(rel.sourceWordFormId.value);
  const targetForm = wordForms.findByUuid(rel.targetWordFormId.value);
  const source = resolveEntry(dictionary, phrases, senses, rel.sourceSenseId.value, wordForms);
  const target = resolveEntry(dictionary, phrases, senses, rel.targetSenseId.value, wordForms);
  const sourceSense = resolveSenseFor(rel.sourceSenseId.value, dictionary, phrases, senses, wordForms);
  const targetSense = resolveSenseFor(rel.targetSenseId.value, dictionary, phrases, senses, wordForms);
  return {
    id: rel.uuid.value,
    source_id: rel.sourceSenseId.value,
    source_word_form_id: rel.sourceWordFormId.value,
    source_text: sourceForm?.text.value ?? source?.text ?? "?",
    source_pos: source ? PartOfSpeech[source.partOfSpeech] : null,
    source_domain: domainLabel(senses, domainName, source, wordForms),
    source_sense_id: (source !== undefined ? wordForms.synsetIdOf(source) : undefined)?.value ?? null,
    source_category: sourceSense?.senseDomainTag?.value ?? null,
    source_gloss: sourceSense?.gloss?.value ?? sourceSense?.definition?.value ?? null,
    target_id: rel.targetSenseId.value,
    target_word_form_id: rel.targetWordFormId.value,
    target_text: targetForm?.text.value ?? target?.text ?? "?",
    target_pos: target ? PartOfSpeech[target.partOfSpeech] : null,
    target_domain: domainLabel(senses, domainName, target, wordForms),
    target_sense_id: (target !== undefined ? wordForms.synsetIdOf(target) : undefined)?.value ?? null,
    target_category: targetSense?.senseDomainTag?.value ?? null,
    target_gloss: targetSense?.gloss?.value ?? targetSense?.definition?.value ?? null,
    kind: LexicalRelationshipType[rel.relationshipType],
    group: relationshipGroup(rel.relationshipType),
    category: relationshipCategory(rel.relationshipType),
    confidence: Math.round(rel.systemProperties.confidenceWeight * 10000) / 10000,
    qualifier: rel.qualifiers.find((q) => q.name.value === MERONYM_KIND_QUALIFIER)?.value.value ?? null,
    via_sense_id: null,
  };
}

export function lexicalRelationshipRecords(
  relationships: LexicalRelationshipStore,
  wordForms: WordForms,
  dictionary: Dictionary,
  phrases: Phrases,
  senses: Senses,
  domainName: string,
): LexicalRelationshipRecord[] {
  return relationships.all().map((rel) => lexicalRelationshipRecordFor(rel, wordForms, dictionary, phrases, senses, domainName));
}

/** `senseExpandedRelationships()`'s own exact mirror -- `word`'s own
 * Sense-level LexicalRelationships, unioned across every Sense
 * `WordForms.senseIdsOf(word)` names. Deliberately NOT `senseExpandedRelationships()`'s own
 * member-fanout -- that expansion exists because a SemanticRelationship
 * only ever names a Sense on each end (senseExpandedRelationships()'s
 * own docstring on why a Word-level view has to fan the *other* Sense
 * back out to its own members). A LexicalRelationship already names one
 * *specific* WordForm on each end (`sourceWordFormId`/`targetWordFormId`,
 * data/lexical_relationship.ts's own docstring) -- `copyLexicalRelationship()`
 * (role/word_seeder.ts) already stores one row per (sourceWordForm,
 * targetWordForm) pair when a derivation pointer is synset-wide, exactly
 * so a fact like "abandon is derived from abandonment" and "desert is
 * derived from desertion" are two independently-stored, independently-
 * correct rows sharing one Sense pair, not one fact this view would
 * otherwise have to re-multiply across the target Sense's own members.
 * Fanning out here on top of that would triple-count: "forsake" derives
 * from "forsaking" would incorrectly also show as if "abandon" itself
 * derived from "forsaking" too.
 *
 * `LexicalRelationshipStore.outgoing()`/`incoming()` are Sense-keyed
 * (that store's own docstring), so a raw query by `senseId` returns
 * *every* row touching that Sense -- including a fellow synonym's own
 * fact, sharing the identical Sense pair (e.g. "desert is derived from
 * desertion" touches the exact same (abandon-sense, abandonment-sense)
 * pair "abandon is derived from abandonment" does, since "abandon" and
 * "desert" are both members of one synset). `ownFormIds` is what
 * narrows this back down to `word`'s own facts specifically: an
 * outgoing row only counts if `word` itself owns `sourceWordFormId`;
 * an incoming row only counts if `word` itself owns `targetWordFormId`
 * -- a fellow member's own row, sharing the Sense but naming a
 * different WordForm on the relevant side, is filtered out here rather
 * than misattributed to `word`. Only the subject's own `word.uuid`
 * substitution survives from the member-fanout pattern above -- needed
 * so `source_id`/`target_id` (client's `relationshipsForWord()`-style
 * `r.source_id === wordId` check) resolve correctly regardless of which
 * of `word`'s own several WordForms the stored row's own
 * sourceWordFormId/targetWordFormId actually names. */
function senseExpandedLexicalRelationships(
  word: Word,
  relationships: LexicalRelationshipStore,
  wordForms: WordForms,
): { relationships: readonly LexicalRelationship[]; viaSenseId: ReadonlyMap<string, string> } {
  const ownFormIds = new Set(wordForms.formsOf(word).map((form) => graphUuid(form)));
  const expanded: LexicalRelationship[] = [];
  const viaSenseId = new Map<string, string>();
  for (const ownSenseId of wordForms.senseIdsOf(word)) {
    const senseId = ownSenseId.value;
    for (const rel of [...relationships.outgoing(senseId), ...relationships.incoming(senseId)]) {
      const outgoingFromSense = rel.sourceSenseId.value === senseId;
      const ownFormId = outgoingFromSense ? rel.sourceWordFormId.value : rel.targetWordFormId.value;
      if (!ownFormIds.has(ownFormId)) continue;
      const uuid = { value: `${rel.uuid.value}:${senseId}` };
      expanded.push({
        ...rel,
        uuid,
        sourceSenseId: outgoingFromSense ? { value: word.uuid.value } : rel.sourceSenseId,
        targetSenseId: outgoingFromSense ? rel.targetSenseId : { value: word.uuid.value },
      });
      viaSenseId.set(uuid.value, senseId);
    }
  }
  return { relationships: expanded, viaSenseId };
}

/** `searchRelationships()`'s own exact mirror. */
export function searchLexicalRelationships(
  relationships: LexicalRelationshipStore,
  wordForms: WordForms,
  dictionary: Dictionary,
  phrases: Phrases,
  senses: Senses,
  domainName: string,
  options: { wordId?: string; query?: string; limit?: number },
): { relationships: LexicalRelationshipRecord[]; totalMatches: number } {
  const limit = options.limit ?? 1000;
  const query = options.query?.trim().toLowerCase();
  let candidates: readonly LexicalRelationship[];
  let viaSenseId: ReadonlyMap<string, string> = new Map();
  if (options.wordId !== undefined) {
    const word = resolveEntry(dictionary, phrases, senses, options.wordId, wordForms);
    const senseExpanded = word !== undefined ? senseExpandedLexicalRelationships(word, relationships, wordForms) : { relationships: [], viaSenseId: new Map() };
    candidates = senseExpanded.relationships;
    viaSenseId = senseExpanded.viaSenseId;
  } else {
    candidates = relationships.all();
  }

  const matches: LexicalRelationshipRecord[] = [];
  // Two rows that render identically -- same kind, same source/target
  // WordForm, same subject Sense -- are indistinguishable to a reader
  // even when their underlying (sourceSense, targetSense) pair genuinely
  // differs. WordNet itself is the reason this happens at all: it
  // sometimes carries two near-duplicate synsets for the same real
  // meaning (e.g. two separate VERB synsets both lexicalizing "abandon,
  // give up"), each independently deriving to the identical target noun
  // sense -- copyLexicalRelationship()'s own reciprocal-pointer dedup
  // (role/word_seeder.ts) correctly keeps both as genuinely distinct
  // facts (different sourceSenseId), so the store itself isn't wrong,
  // but showing "abandonment is the noun form of abandon." twice, back
  // to back, with no visible difference between the two rows, reads as
  // a bug regardless. `seen` collapses that here, at render time, rather
  // than papering over it in the data itself.
  const seen = new Set<string>();
  let totalMatches = 0;
  for (const rel of candidates) {
    const record = lexicalRelationshipRecordFor(rel, wordForms, dictionary, phrases, senses, domainName);
    const senseId = viaSenseId.get(rel.uuid.value);
    if (senseId !== undefined) record.via_sense_id = senseId;
    const dedupeKey = `${record.via_sense_id ?? ""}|${record.kind}|${record.source_word_form_id}|${record.target_word_form_id}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    if (query) {
      const sourceHit = record.source_text.toLowerCase().includes(query);
      const targetHit = record.target_text.toLowerCase().includes(query);
      const kindHit = record.kind.toLowerCase().includes(query);
      if (!sourceHit && !targetHit && !kindHit) continue;
    }
    totalMatches += 1;
    if (matches.length < limit) matches.push(record);
  }
  return { relationships: matches, totalMatches };
}

/** `relationshipKindCounts()`'s own exact mirror. */
export function lexicalRelationshipKindCounts(relationships: LexicalRelationshipStore): LexicalRelationshipKindCount[] {
  const counts = new Map<string, { group: number; count: number }>();
  for (const rel of relationships.all()) {
    const kind = LexicalRelationshipType[rel.relationshipType];
    const existing = counts.get(kind);
    if (existing) existing.count += 1;
    else counts.set(kind, { group: relationshipGroup(rel.relationshipType), count: 1 });
  }
  return [...counts.entries()].map(([kind, { group, count }]) => ({ kind, group, count }));
}
