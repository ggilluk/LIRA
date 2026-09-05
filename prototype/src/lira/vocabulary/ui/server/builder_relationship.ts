/** SemanticRelationship's own client-facing record and query surface --
 * split out of ui/dictionary_view.ts's own DictionaryView class (formerly
 * the private methods resolveSenseFor/relationshipRecordFor/
 * senseExpandedRelationships and the public methods searchRelationships/
 * relationshipKindCounts). */

import { meronymKindLabel } from "../../data/enums/lexical_relationship_type";
import { SemanticRelationshipKind } from "../../data/enums/semantic_relationship_kind";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Dictionary } from "../../data/dictionary";
import type { Phrases } from "../../data/phrases";
import type { Senses } from "../../data/senses";
import type { Sense } from "../../data/entities/sense";
import type { SemanticRelationship } from "../../data/semantic_relationship";
import type { SemanticRelationshipStore } from "../../data/semantic_relationship_store";
import { graphUuid as phraseGraphUuid, type Phrase } from "../../data/entities/phrase";
import type { Word } from "../../data/entities/word";
import type { WordForms } from "../../data/word_forms";
import { graphUuid as wordGraphUuid } from "../../role/word_processor";
import { resolveEntry } from "./resolver_entity";
import { domainLabel } from "./resolver_domain";

/** `member`'s own per-Domain graph identity -- Phrase's own entryId
 * now carries the identical two-role shape Word's own does (both
 * folded from Identifier.uuid, data/entities/word.ts's own docstring),
 * so this just picks which of the two matching graphUuid() functions
 * to call. `data/senses.ts`'s own identical `memberUuid()`. */
function memberUuid(member: Word | Phrase): string {
  return "senseIds" in member ? phraseGraphUuid(member) : wordGraphUuid(member);
}

export interface RelationshipRecord {
  id: string;
  source_id: string;
  source_text: string;
  source_pos: string | null;
  source_domain: string | null;
  source_sense_id: string | null;
  // Sense.senseDomainTag's own exact counterpart, read directly off the
  // source/target Sense (rel.sourceSenseId/targetSenseId -- every
  // SemanticRelationship connects two Senses now, so no resolveEntry()
  // representative-member indirection is needed to reach them the way
  // source_text/target_text's own Word-shaped fields do). null for a
  // Sense with no WordNet-sourced category (a hand-curated one,
  // Sense.senseDomainTag's own docstring), never a placeholder string.
  source_category: string | null;
  // The Sense's own short descriptive text -- Sense.gloss when a
  // hand-curated entry actually has one, else Sense.definition (every
  // WordNet-seeded Sense's own real prose: WordSeeder.seedWordNet's own
  // createSense call never populates Sense.gloss at all, only
  // definition, so gloss alone would read blank for exactly the
  // WordNet-sourced Senses senseDomainTag exists for). null only when
  // neither field is set.
  source_gloss: string | null;
  target_id: string;
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
  // meronymKindLabel() of this edge's own `meronymKind` ("part"/"member"/
  // "substance") for a WordNet-seeded MERONYM edge, or null for every
  // other kind and for a hand-curated Common Vocabulary Cache MERONYM/
  // HOLONYM fact (which draws no such distinction) --
  // lexical_relationship_type.ts's own MERONYM docstring on why this
  // rides as a qualifying field rather than its own relationship kind.
  qualifier: string | null;
  // Which of the *subject* Word/Phrase's own several Senses
  // (Word.senseIds's own docstring) this row's edge actually came from
  // -- that Sense's own uuid, matching one of WordRecord.senses's own
  // `id` entries for the same Word (so the client can group a Word's
  // relationships under its own Senses section, sensesSectionHTML()'s
  // own docstring, without a second id-to-definition lookup) -- or null
  // for a genuine direct Word/Phrase-to-Word/Phrase edge (always
  // unambiguous, no Sense expansion involved) or for a query with no
  // single subject Word at all (a plain Relationships-tab search with no
  // `wordId`). Only ever set by searchRelationships()'s own `wordId`
  // path, off senseExpandedRelationships()'s own per-sense loop -- the
  // one place that already knows exactly which Sense produced a given
  // synthetic row.
  via_sense_id: string | null;
}

// One kind's total edge count across the whole SemanticRelationshipStore
// -- resolveHierarchy()'s own docstring on why this exists: the
// Hierarchy/Cyclic tabs' own "Relationship kind" dropdowns need to know
// which kinds exist (and how many edges each has) regardless of
// MAX_INTERACTIVE_WORDS, the same reason POS_VALUES/DOMAIN_VALUES are
// embedded unconditionally already (render()'s own
// substitutions). `group` rides along so the client can apply the same
// KIND_PAIR_GROUPS-style grouping/filtering it already does today
// without a second round trip just to look up one kind's group.
export interface RelationshipKindCount {
  kind: string;
  group: number;
  count: number;
}

/** Resolves `id` to a Sense for category/gloss display -- a direct hit
 * covers every genuine Sense-to-Sense edge (the normal case: every
 * SemanticRelationship really does connect two Senses). Falls back to
 * that Word/Phrase's own primary Sense (senseIds[0]) when `id` isn't a
 * Sense at all, which happens for one side of a
 * senseExpandedRelationships() synthetic fan-out row -- that function
 * deliberately pins the queried word's own uuid there instead of a
 * Sense uuid (that function's own docstring on why: keeping `wordId`
 * itself, not swapped to a representative member). A reasonable,
 * not-perfectly-precise stand-in for that one synthetic case, the same
 * kind of representative simplification resolveEntry() already makes
 * for source_text/target_text on the exact same rows. */
function resolveSenseFor(id: string, dictionary: Dictionary, phrases: Phrases, senses: Senses, wordForms: WordForms): Sense | undefined {
  const direct = senses.findByUuid(id);
  if (direct !== undefined) return direct;
  const entity = resolveEntry(dictionary, phrases, senses, id, wordForms);
  const primarySenseId = entity !== undefined ? wordForms.senseIdsOf(entity)[0]?.value : undefined;
  return primarySenseId !== undefined ? senses.findByUuid(primarySenseId) : undefined;
}

/** One SemanticRelationship's full RelationshipRecord -- shared by
 * relationshipRecords() (the whole-store path, only ever run under
 * MAX_INTERACTIVE_WORDS) and searchRelationships() (resolved
 * relationship-by-relationship regardless of scale), same reasoning
 * as wordRecordFor()/wordRecords(). `source`/`target` resolve via
 * resolveEntry()'s own Sense-representative-member fallback -- every
 * SemanticRelationship connects two Senses now, never a Word/Phrase
 * directly, so that fallback is always the one that actually fires
 * here (Dictionary/Phrases never match a Sense uuid). `group`/`category`
 * are always 1/0 -- SemanticRelationshipKind has no bit-packed group/
 * category structure of its own (that enum's own docstring: every
 * member is already the same one group, so there's nothing left to
 * pack), but the client-side pill styling still keys off `group`, so
 * this keeps reporting the same "Lexical Semantic" group number every
 * relationship here always was, back when LexicalRelationshipType's
 * own group 1 held these same kinds. */
export function relationshipRecordFor(
  rel: SemanticRelationship,
  dictionary: Dictionary,
  phrases: Phrases,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): RelationshipRecord {
  const source = resolveEntry(dictionary, phrases, senses, rel.sourceSenseId.value, wordForms);
  const target = resolveEntry(dictionary, phrases, senses, rel.targetSenseId.value, wordForms);
  const sourceSense = resolveSenseFor(rel.sourceSenseId.value, dictionary, phrases, senses, wordForms);
  const targetSense = resolveSenseFor(rel.targetSenseId.value, dictionary, phrases, senses, wordForms);
  return {
    id: rel.uuid.value,
    source_id: rel.sourceSenseId.value,
    source_text: source?.text ?? "?",
    source_pos: source ? PartOfSpeech[source.partOfSpeech] : null,
    source_domain: domainLabel(senses, domainName, source, wordForms),
    source_sense_id: (source !== undefined ? wordForms.synsetIdOf(source) : undefined)?.value ?? null,
    source_category: sourceSense?.senseDomainTag?.value ?? null,
    source_gloss: sourceSense?.gloss?.value ?? sourceSense?.definition?.value ?? null,
    target_id: rel.targetSenseId.value,
    target_text: target?.text ?? "?",
    target_pos: target ? PartOfSpeech[target.partOfSpeech] : null,
    target_domain: domainLabel(senses, domainName, target, wordForms),
    target_sense_id: (target !== undefined ? wordForms.synsetIdOf(target) : undefined)?.value ?? null,
    target_category: targetSense?.senseDomainTag?.value ?? null,
    target_gloss: targetSense?.gloss?.value ?? targetSense?.definition?.value ?? null,
    kind: SemanticRelationshipKind[rel.relationshipType],
    group: 1,
    category: 0,
    confidence: Math.round(rel.systemProperties.confidenceWeight * 10000) / 10000,
    qualifier: rel.meronymKind !== undefined ? meronymKindLabel(rel.meronymKind) : null,
    via_sense_id: null,
  };
}

export function relationshipRecords(
  relationships: SemanticRelationshipStore,
  dictionary: Dictionary,
  phrases: Phrases,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): RelationshipRecord[] {
  return relationships.all().map((rel) => relationshipRecordFor(rel, dictionary, phrases, senses, domainName, wordForms));
}

/** `word`'s own Sense-level relationships, expanded back out to one
 * synthetic SemanticRelationship per fellow member of the Sense on the
 * *other* end -- searchRelationships()'s own fast path needs this
 * because `relationships.outgoing(wordId)`/`incoming(wordId)`
 * alone only ever finds a direct Word/Phrase-to-Word/Phrase edge now;
 * a synset-wide Lexical Semantic fact is stored under `wordId`'s own
 * Sense instead (WordSeeder.seedPointerRelationship's own docstring).
 * Each synthetic record keeps `wordId` itself pinned to whichever side
 * it was actually on (not swapped to the Sense's representative
 * member, unlike resolveEntry()'s own single-row simplification) and
 * fans the *other* side out to every member Senses.membersOf()
 * finds -- recovering the exact per-member row set the pre-Sense
 * member x member encoding used to store explicitly. `uuid` gets the
 * source edge's own uuid suffixed with the expanded member's uuid, not
 * reused bare, since more than one synthetic record can now share one
 * underlying Sense-to-Sense edge. Unions this across every Sense in
 * `word.senseIds` -- a polysemous Word (Word.senseIds's own docstring)
 * has more than one to expand, not just the single one this used to
 * read off `word.senseId`. `viaSenseId` is that per-Sense loop's own
 * byproduct: which of `word`'s several Senses actually produced a
 * given synthetic row, keyed by that row's own `uuid.value` and valued
 * by the producing Sense's own uuid -- searchRelationships()'s own
 * RelationshipRecord.via_sense_id reads this, so the Words-tab detail
 * panel can group a polysemous Word's relationships under the Sense
 * each one actually belongs to (sensesSectionHTML()'s own docstring,
 * embedded client script). */
function senseExpandedRelationships(
  word: Word,
  relationships: SemanticRelationshipStore,
  senses: Senses,
  wordForms: WordForms,
): { relationships: readonly SemanticRelationship[]; viaSenseId: ReadonlyMap<string, string> } {
  const expanded: SemanticRelationship[] = [];
  const viaSenseId = new Map<string, string>();
  for (const ownSenseId of wordForms.senseIdsOf(word)) {
    const senseId = ownSenseId.value;
    for (const rel of [...relationships.outgoing(senseId), ...relationships.incoming(senseId)]) {
      const outgoingFromSense = rel.sourceSenseId.value === senseId;
      const otherSenseId = outgoingFromSense ? rel.targetSenseId.value : rel.sourceSenseId.value;
      for (const member of senses.membersOf(otherSenseId)) {
        const memberId = { value: memberUuid(member) };
        const uuid = { value: `${rel.uuid.value}:${memberId.value}` };
        expanded.push({
          ...rel,
          uuid,
          sourceSenseId: outgoingFromSense ? { value: wordGraphUuid(word) } : memberId,
          targetSenseId: outgoingFromSense ? memberId : { value: wordGraphUuid(word) },
        });
        viaSenseId.set(uuid.value, senseId);
      }
    }
  }
  return { relationships: expanded, viaSenseId };
}

/** Resolves a Relationships-tab search (or, given `wordId`, "every
 * relationship touching this one Word" -- the Words-tab detail
 * panel's own need, over MAX_INTERACTIVE_WORDS) on demand, the
 * relationship-side counterpart to searchWords() (that function's own
 * docstring). `wordId` takes the fast path: SemanticRelationshipStore's
 * own outgoing()/incoming() are O(1) indexed (lexical_relationship_store.ts's
 * own docstring), so looking up one Word's relationships never scans
 * the whole store, however large it's grown -- unlike a `query`-only
 * or unfiltered search, which does (still just a linear scan of plain
 * string comparisons, tens to low hundreds of milliseconds even at
 * WordNet's ~1,260,000-relationship scale, nowhere near
 * MAX_INTERACTIVE_WORDS's own JSON.stringify ceiling since nothing
 * here embeds the result, only returns a capped slice of it). */
export function searchRelationships(
  relationships: SemanticRelationshipStore,
  dictionary: Dictionary,
  phrases: Phrases,
  senses: Senses,
  domainName: string,
  options: { wordId?: string; query?: string; limit?: number },
  wordForms: WordForms,
): { relationships: RelationshipRecord[]; totalMatches: number } {
  const limit = options.limit ?? 1000;
  const query = options.query?.trim().toLowerCase();
  let candidates: readonly SemanticRelationship[];
  let viaSenseId: ReadonlyMap<string, string> = new Map();
  if (options.wordId !== undefined) {
    const word = resolveEntry(dictionary, phrases, senses, options.wordId, wordForms);
    // No direct `relationships.outgoing(options.wordId)`/
    // `incoming(...)` query any more, unlike the SemanticRelationshipStore
    // era -- SemanticRelationshipStore is Sense-keyed exclusively now
    // (DictionaryView's own class docstring), so a raw Word/Phrase id
    // can never itself be a key in it; senseExpandedRelationships()
    // above is the only source of a word-scoped relationship list.
    const senseExpanded =
      word !== undefined ? senseExpandedRelationships(word, relationships, senses, wordForms) : { relationships: [], viaSenseId: new Map() };
    candidates = senseExpanded.relationships;
    viaSenseId = senseExpanded.viaSenseId;
  } else {
    candidates = relationships.all();
  }

  const matches: RelationshipRecord[] = [];
  let totalMatches = 0;
  for (const rel of candidates) {
    const record = relationshipRecordFor(rel, dictionary, phrases, senses, domainName, wordForms);
    const senseId = viaSenseId.get(rel.uuid.value);
    if (senseId !== undefined) record.via_sense_id = senseId;
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

/** One entry per relationship kind actually present in this
 * Dictionary -- embedded into the rendered page unconditionally
 * (render()'s own POS_VALUES/DOMAIN_VALUES precedent), so the
 * Hierarchy/Cyclic tabs' own "Relationship kind" dropdowns have
 * something to populate from even past MAX_INTERACTIVE_WORDS, where
 * the client-side RELS array they used to read from is always empty. */
export function relationshipKindCounts(relationships: SemanticRelationshipStore): RelationshipKindCount[] {
  const counts = new Map<string, number>();
  for (const rel of relationships.all()) {
    const kind = SemanticRelationshipKind[rel.relationshipType];
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  // group is always 1 ("Lexical Semantic") -- relationshipRecordFor()'s
  // own docstring on why every SemanticRelationship row reports that
  // same group number now, unconditionally.
  return [...counts.entries()].map(([kind, count]) => ({ kind, group: 1, count }));
}
