/** DictionaryView: renders a Dictionary and its LexicalRelationshipStore
 * as a single self-contained HTML page (vocabulary/documentation/README.md
 * covers the data this reads; see vocabulary/ui/README.md for the
 * Python original this was ported from). All Word and LexicalRelationship
 * data is embedded as JSON and searched/filtered/sorted client-side in
 * vanilla JS -- no server, no external requests -- so render() returns
 * a fully self-contained document. Uses only system font stacks (no
 * CDN or embedded webfont) so the output stays a single dependency-free
 * string.
 *
 * Ported from vocabulary/ui/dictionary_view.py. The Python original's
 * CSS/HTML/client-side JS is already implementation-agnostic web tech
 * (not Python) -- this port carries it over character-for-character in
 * PAGE_TEMPLATE below (mechanical extraction, not a rewrite), and ports
 * only the *Python* surface: the DictionaryView class that assembles
 * the @@TOKEN@@ substitution values from a real Dictionary/
 * LexicalRelationshipStore instead of from dataclasses. */

import type { Text } from "../../value_objects";
import { ADJECTIVE_FORM_PATTERNS, isAdjective } from "../data/adjective";
import { ADVERB_FORM_PATTERNS, isAdverb } from "../data/adverb";
import type { Dictionary } from "../data/dictionary";
import { DETERMINER_FORM_PATTERNS, isDeterminer } from "../data/determiner";
import { EditorialLabel } from "../data/enums/editorial_label";
import type { LexicalRelationship } from "../data/lexical_relationship";
import type { LexicalRelationshipStore } from "../data/lexical_relationship_store";
import { LexicalRelationshipType, MERONYM_KIND_QUALIFIER, relationshipCategory, relationshipGroup } from "../data/enums/lexical_relationship_type";
import { NOUN_FORM_PATTERNS, isNoun } from "../data/noun";
import { PartOfSpeech } from "../data/enums/part_of_speech";
import { phraseAsWord, type Phrase } from "../data/phrase";
import { PhraseType } from "../data/enums/phrase_type";
import { Phrases } from "../data/phrases";
import { PRONOUN_FORM_PATTERNS, isPronoun } from "../data/pronoun";
import { RegisterCode } from "../data/enums/register_code";
import type { Sense } from "../data/sense";
import { Senses } from "../data/senses";
import { VERB_FORM_PATTERNS, isVerb } from "../data/verb";
import { definitionWords, type Word } from "../data/word";

const DEFINITION_TOKEN_PATTERN = /[^\W_]+/g;

const GROUP_NAMES: Record<number, string> = { 0: "Morphological", 1: "Lexical Semantic", 2: "Orthographic and Naming" };

const GROUP_COLORS: Record<number, string> = { 0: "#3B6EA5", 1: "#B2542D", 2: "#7A5CA6" };

const POS_COLORS: Record<string, string> = {
  [PartOfSpeech[PartOfSpeech.NOUN]]: "#3B6EA5",
  [PartOfSpeech[PartOfSpeech.PROPER_NOUN]]: "#274472",
  [PartOfSpeech[PartOfSpeech.VERB]]: "#B2542D",
  [PartOfSpeech[PartOfSpeech.ADJECTIVE]]: "#7A5CA6",
  [PartOfSpeech[PartOfSpeech.ADVERB]]: "#B08900",
  [PartOfSpeech[PartOfSpeech.PRONOUN]]: "#5B7B6F",
  [PartOfSpeech[PartOfSpeech.DETERMINER]]: "#6E7B8B",
  [PartOfSpeech[PartOfSpeech.PREPOSITION]]: "#7B6E5B",
  [PartOfSpeech[PartOfSpeech.CONJUNCTION]]: "#6B7280",
  [PartOfSpeech[PartOfSpeech.PARTICLE]]: "#8A7B6E",
  [PartOfSpeech[PartOfSpeech.AUXILIARY]]: "#5B6E8B",
  [PartOfSpeech[PartOfSpeech.INTERJECTION]]: "#C2544B",
  [PartOfSpeech[PartOfSpeech.NUMERAL]]: "#4B8A7B",
  [PartOfSpeech[PartOfSpeech.SYMBOL]]: "#8A8A8A",
  [PartOfSpeech[PartOfSpeech.PUNCTUATION]]: "#9A9A9A",
  [PartOfSpeech[PartOfSpeech.OTHER]]: "#7A7A7A",
};

/** "pluralNumberForm" -> "Plural Number Form" -- every *_Form field name
 * this codebase defines is camelCase built from Title Case words (each
 * one already capitalized after the first, camelCase's own convention),
 * so splitting on an uppercase letter and capitalizing the first
 * character recovers exactly the Word Form to Part of Speech Matrix's
 * own row names (data/word_form_part_of_speech_matrix.md) without
 * needing a second, hand-maintained label table. */
function formFieldLabel(field: string): string {
  const spaced = field.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The text strictly between two `@@MARKER@@` comment tokens already
 * present in rendered HTML/CSS/JS -- used by renderFragment() below. */
function extractBetween(html: string, startMarker: string, endMarker: string): string {
  const start = html.indexOf(startMarker) + startMarker.length;
  const end = html.indexOf(endMarker, start);
  return html.slice(start, end).replace(/^\n+|\n+$/g, "");
}

export interface WordRecord {
  id: string;
  entry_id: string;
  lexical_form: string;
  text: string;
  pos: string;
  // The Princeton WordNet 3.1 synset this Word corresponds to
  // (word.synsetId's own docstring), or null for a Word that didn't
  // come from WordSeeder.seedWordNet -- every Common Vocabulary Cache
  // entry, in particular.
  sense_id: string | null;
  definition: string;
  gloss: string;
  register_codes: string[];
  dialect_codes: string[];
  editorial_labels: string[];
  is_common: boolean;
  is_root_word: boolean;
  is_derivable_noun: boolean;
  domain: string | null;
  // Extra topic domains the same WordNet sense also carries beyond its
  // primary `domain` (Word.relatedDomainTags's own docstring) -- e.g.
  // "winger" is a wing position in soccer, hockey, rugby, AND
  // field_hockey, so `domain` is one of those and this holds the rest.
  // Always empty for a non-WordNet word, or a WordNet sense with at
  // most one topic-domain pointer -- the common case.
  related_domains: string[];
  is_fully_hydrated: boolean;
  sources: string[];
  relationship_count: number;
  definition_segments: DefinitionSegment[];
  // Present only when this record was resolved from a Phrase, not a
  // genuine Word (DictionaryView.searchWords()'s own `wordId` branch) --
  // `text`/`lexical_form`'s own token-by-token breakdown into each
  // constituent Word ("toy poodle" -> "toy", "poodle"), the headword
  // counterpart of definition_segments above, built from that Phrase's
  // own already-stored `words` references (phraseWordSegments()'s own
  // docstring) rather than re-resolved from scratch. undefined for an
  // ordinary Word, which has no sub-word composition of its own to show.
  phrase_word_segments?: DefinitionSegment[];
  // phrase_word_segments's own exact counterpart for Phrase.phraseType
  // (word_seeder.ts's own classifyPhraseType, WordSeeder.seedWordNet) --
  // the enum's own key string (e.g. "PREPOSITIONAL_PHRASE"), same
  // PhraseType[...] convention `pos` above already uses for
  // PartOfSpeech -- the client applies titleCase() at render time, not
  // this. Present only when this record was resolved from a Phrase that
  // HAS a phraseType; undefined for an ordinary Word (no such concept
  // applies) and for a Phrase whose own phraseType is itself undefined
  // (every Common Vocabulary Cache closed-class Phrase, and any
  // WordNet-seeded one classifyPhraseType() couldn't classify -- neither
  // exists in the bundled data today, but the field stays optional
  // either way).
  phrase_type?: string;
  pad: { pleasure: number; arousal: number; dominance: number } | null;
  // Every *_Form Text field this Word's own concrete POS subtype
  // carries a populated value for, in the Word Form to Part of Speech
  // Matrix's own field order (data/word_form_part_of_speech_matrix.md)
  // -- DictionaryView.wordFormsFor()'s own docstring on how this is
  // built. Always includes baseLemmaCanonicalForm when set (every POS
  // carries that one), plus whichever of that subtype's own fields
  // (Noun/Verb/Adjective/Adverb/Pronoun/Determiner -- the other five POS
  // classes declare no *_Form field of their own beyond
  // baseLemmaCanonicalForm) are populated. Empty for a Word with
  // nothing seeded yet -- no seeding path (word_seeder.ts) populates any
  // of these fields today, so this is empty for every Word until a
  // future seeding/curation pass writes to them.
  word_forms: WordFormEntry[];
  // Every Sense (data/sense.ts) this Word lexicalizes, in Word.senseIds's
  // own order (DictionaryView.sensesFor()'s own docstring on how this is
  // built) -- one entry per real WordNet sense for a polysemous Word
  // ("big" ADJECTIVE: "above average in size", "pregnant", "generous",
  // ...), not just the one `definition`/`domain` above already shows
  // (that's always senses[0], Word.senseIds's own "primary sense" doc).
  // A Phrase's own detail panel gets this too -- it's resolved into a
  // WordRecord via phraseAsWord() (phrase.ts) before reaching here, not
  // a separate PhraseRecord field. Empty only for a Word/Phrase that
  // never lexicalized any Sense at all (predates WordSeeder.seedWordNet/
  // registerUniqueSense, or a hand-authored test fixture).
  senses: WordSenseSummary[];
}

export interface WordFormEntry {
  field: string;
  label: string;
  value: string;
}

export interface WordSenseSummary {
  id: string;
  is_primary: boolean;
  definition: string;
  gloss: string;
  domain: string;
  // Sense.senseFrequency's own docstring (data/sense.ts) -- how often
  // this exact meaning was tagged in WordNet's own semantic concordance
  // corpus, summed across every lemma that lexicalizes it. `null`, not
  // `0`, for a Sense that didn't come from WordSeeder.seedWordNet at all
  // (mirrors that field's own undefined-vs-0 distinction, since a plain
  // client-facing record has no `undefined` of its own -- JSON drops
  // it); a real `0` still means "WordNet tagged it, just never in the
  // concordance," a materially different fact from "no WordNet
  // frequency data exists for this Sense at all." `senseIds`'s own
  // order already reflects this (WordSeeder.seedWordNet's own
  // orderSensesByFrequency, role/word_seeder.ts) -- highest first, so
  // `is_primary` below and this field agree by construction rather than
  // by coincidence.
  frequency: number | null;
  // Fellow members of this one Sense, this Word/Phrase itself excluded --
  // the sense-scoped synonym fact (Senses.membersOf()'s own docstring,
  // data/senses.ts) other Senses this same Word also carries have no part
  // in. Carries `id` (that member's own uuid) alongside its display text
  // so the client can render it as the same clickable data-pivot-id
  // button every other related-word row already uses
  // (wireDetailPivotButtons(), this file's own embedded client script).
  synonyms: { id: string; text: string }[];
}

type DefinitionSegment =
  | { text: string }
  | { text: string; word: true; resolved: false }
  | { text: string; word: true; resolved: true; word_id: string; lexical_form: string; pos: string; domain: string | null; gloss: string };

// Phrase's own client-facing record -- deliberately leaner than
// WordRecord (no relationship_count/definition_segments/pad/domain):
// the Phrases tab itself stays a plain searchable list, not a
// word-with-a-detail-panel view the way Words is. A WordNet-seeded
// Phrase's own relationships (it does participate in
// LexicalRelationshipStore now -- word_seeder.ts's own seedWordNet)
// are still fully visible, just via the Relationships/Hierarchy tabs'
// own resolveEntry() fallback to Phrases, not through this record.
export interface PhraseRecord {
  id: string;
  entry_id: string;
  lexical_form: string;
  text: string;
  pos: string;
  // The enum's own key string (e.g. "PREPOSITIONAL_PHRASE"), same
  // PhraseType[...] convention WordRecord.phrase_type already uses --
  // undefined for a Phrase whose own phraseType is itself undefined
  // (every Common Vocabulary Cache closed-class Phrase, and any
  // WordNet-seeded one classifyPhraseType() couldn't classify,
  // word_seeder.ts).
  phrase_type?: string;
  definition: string;
  gloss: string;
  register_codes: string[];
  dialect_codes: string[];
  editorial_labels: string[];
  is_common: boolean;
  sources: string[];
}

// Sense's own client-facing record -- the Senses tab's own row shape.
// Unlike WordRecord/PhraseRecord, a Sense has no `lexical_form` of its
// own to sort/search by (Sense's own docstring, data/sense.ts, on why
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
  // Sense.senseFrequency's own docstring (data/sense.ts) --
  // WordSenseSummary.frequency's own exact counterpart for the Senses
  // tab's own row shape, same null-vs-0 distinction.
  sense_frequency: number | null;
}

export interface RelationshipRecord {
  id: string;
  source_id: string;
  source_text: string;
  source_pos: string | null;
  source_domain: string | null;
  source_sense_id: string | null;
  target_id: string;
  target_text: string;
  target_pos: string | null;
  target_domain: string | null;
  target_sense_id: string | null;
  kind: string;
  group: number;
  category: number;
  confidence: number;
  // MERONYM_KIND_QUALIFIER's own value ("part"/"member"/"substance") for
  // a WordNet-seeded MERONYM edge, or null for every other kind and for
  // a hand-curated Common Vocabulary Cache MERONYM/HOLONYM fact (which
  // draws no such distinction) -- lexical_relationship_type.ts's own
  // MERONYM docstring on why this rides as a qualifier rather than its
  // own relationship kind.
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

// One kind's total edge count across the whole LexicalRelationshipStore
// -- resolveHierarchy()'s own docstring on why this exists: the
// Hierarchy/Cyclic tabs' own "Relationship kind" dropdowns need to know
// which kinds exist (and how many edges each has) regardless of
// MAX_INTERACTIVE_WORDS, the same reason POS_VALUES/DOMAIN_VALUES are
// embedded unconditionally already (renderFragment()'s own
// substitutions). `group` rides along so the client can apply the same
// KIND_PAIR_GROUPS-style grouping/filtering it already does today
// without a second round trip just to look up one kind's group.
export interface RelationshipKindCount {
  kind: string;
  group: number;
  count: number;
}

// One resolved Word, as much as a Hierarchy tree node needs to render
// itself (posPill/domainPill/senseIdBadge) -- deliberately not a full
// WordRecord (relationship_count, definition, PAD, ... none of that is
// shown inside a tree node).
export interface HierarchyNode {
  id: string;
  lexical_form: string;
  pos: string;
  domain: string | null;
  sense_id: string | null;
}

export interface HierarchyEdge {
  parentId: string;
  childId: string;
}

// resolveHierarchy()'s own result -- see that method's docstring for
// what each field means and how `fellBack`/`truncated` should be
// handled by a caller.
export interface HierarchyResolution {
  nodes: readonly HierarchyNode[];
  edges: readonly HierarchyEdge[];
  roots: readonly string[];
  totalEdgeCount: number;
  totalNodeCount: number;
  fellBack: boolean;
  truncated: boolean;
}

export interface DictionaryViewOptions {
  title?: string;
  domainName?: string;
  unresolved?: readonly string[];
  // Undefined/omitted means an empty Phrases tab -- every existing
  // caller that predates Phrase (phrase.ts's own docstring) keeps
  // working with zero changes, same reasoning DictionaryView's own
  // constructor default gives this field.
  phrases?: Phrases;
  // Sense's own exact counterpart -- undefined/omitted means every
  // existing caller that predates Sense keeps working unchanged
  // (resolveEntry()'s own docstring on why an omitted Senses simply
  // means "no Sense-typed relationship endpoint will ever be seen",
  // true for every pre-Sense Domain).
  senses?: Senses;
}

// A hard ceiling on how many Words this view will build full,
// per-Word interactive records for (wordRecords()/relationshipRecords())
// and embed into the page's own client-side WORDS/RELS arrays. Below
// it, the Words/Relationships/Hierarchy/Cyclic tabs behave exactly as
// they always have -- a full, searchable, client-side data set (the
// original Python page's own design, ~3,100 words for the real Common
// Vocabulary Cache). Above it, this class renders a clear "too many
// Words for this view" notice instead: embedding a Domain the size
// WordSeeder.seedWordNet (role/word_seeder.ts) can produce -- ~211,000
// Words, ~780,000 relationships -- as one client-side JSON literal
// doesn't just get slow, `JSON.stringify` on that many WordRecords
// throws `RangeError: Invalid string length` outright, well past the
// JS engine's own maximum string length. The stat tiles above the tabs
// stay accurate regardless (render()'s own totalWordCount/
// totalRelationshipCount, computed directly off the Dictionary/
// LexicalRelationshipStore, never off the capped arrays) -- only the
// interactive browse-every-word experience is unavailable past this
// ceiling, not the counts.
const MAX_INTERACTIVE_WORDS = 20_000;

// The kinds word_seeder.ts's own relationshipKindForPointer stores as
// only ONE edge per fact, always oriented child -> kind -> parent (that
// function's own docstring on why: WordNet redundantly lists every
// hypernym/meronym fact from both ends, so the parent-listed side is
// canonicalized onto the child-listed side's kind instead of creating a
// second, fully redundant edge). resolveHierarchy() needs to know this
// to orient a tree correctly -- for any OTHER kind, the stored
// (source, target) pair already reads source-as-parent/target-as-child
// (the Relationships tab's own literal reading), but for these two,
// the *parent* is the edge's target and the *child* is its source --
// backwards from every other kind, because there is no longer a
// separately-stored HYPONYM/HOLONYM edge whose own (source, target)
// would already read the natural way. MERONYM covers every WordNet
// part/member/substance fact alike now (its own meronymKind qualifier
// distinguishes which, lexical_relationship_type.ts's own docstring) --
// there is no longer a separate PART_MERONYM/MEMBER_MERONYM/
// SUBSTANCE_MERONYM kind to list here. INSTANCE_HYPERNYM/
// INSTANCE_HYPONYM (WordNet's own `@i`/`~i`, instance-of) are retired
// too -- word_seeder.ts's own relationshipKindForPointer never seeds
// them at all, so there is nothing of that kind to orient here either.
const HIERARCHY_INVERTED_KINDS: ReadonlySet<LexicalRelationshipType> = new Set([
  LexicalRelationshipType.HYPERNYM,
  LexicalRelationshipType.MERONYM,
]);

// Kinds with no meaningful "broader/narrower" direction at all -- every
// member of a mutually-related group is as broad or narrow as every
// other, so resolveHierarchy() should offer its own cluster view
// (buildClusters()'s own client-side equivalent) instead of a tree with
// an arbitrary "root". SYNONYM (allPairs()'s own i<j-only pairing,
// word_seeder.ts) and word_seeder.ts's own SYMMETRIC_RELATIONSHIP_KINDS
// (ANTONYM, VERB_GROUP, ATTRIBUTE, ALSO_SEE, DERIVED_FORM) are all
// stored as exactly ONE directed edge per fact, not two -- so
// `rootCandidates.length === 0` (every node has both directions) is
// NOT a reliable way to detect these anymore: a mutually-synonymous
// clique of N words under i<j pairing always has at least one word
// with no *incoming* edge (whichever sorts first), so the naive check
// would pick that word as a "root" and draw a nonsensical tree instead
// of falling back to clusters, exactly the "buttocks" -- a real WordNet
// SYNONYM "root" -- bug this Set exists to prevent. Named explicitly,
// not inferred, because inferring it from stored edge shape is exactly
// what broke the first time (word_seeder.ts's own reciprocal-dedup fix
// changed that shape without this method's own root detection noticing).
const SYMMETRIC_HIERARCHY_KINDS: ReadonlySet<LexicalRelationshipType> = new Set([
  LexicalRelationshipType.SYNONYM,
  LexicalRelationshipType.ANTONYM,
  LexicalRelationshipType.VERB_GROUP,
  LexicalRelationshipType.ATTRIBUTE,
  LexicalRelationshipType.ALSO_SEE,
  LexicalRelationshipType.DERIVED_FORM,
]);

// resolveHierarchy()'s own default node cap when a caller doesn't pass
// its own `limit` -- generous enough to show a genuinely useful subtree
// (HIERARCHY_NODE_LIMIT's own client-side docstring, dictionary_view.ts's
// embedded script) without risking the same JSON.stringify-on-too-much-
// data ceiling MAX_INTERACTIVE_WORDS exists to avoid in the first place.
const DEFAULT_HIERARCHY_NODE_LIMIT = 500;

/** Builds the HTML page. Construct with the Dictionary and
 * LexicalRelationshipStore to display -- typically a Domain's
 * `domain.vocabulary.dictionary` and `domain.vocabulary.lexicalRelationships`
 * -- call `render()` for the HTML string. */
export class DictionaryView {
  private readonly title: string;
  // A Word carries no domain field of its own (a Domain owns its
  // Dictionary; the Word doesn't know which Domain it's in) -- this
  // view renders exactly one Domain's Dictionary at a time, so every
  // Word in it is either that Domain's own (word.isCommon is false) or
  // inherited from Common (word.isCommon is true). domainName supplies
  // the label for the former; "Common" is never overridden.
  private readonly domainName: string;
  // Words a caller looked up and could not resolve (no seeded sense,
  // no successful hydration) -- optional. Never derived from the
  // Dictionary itself: an unresolved word by definition has no Word
  // record to find here.
  private readonly unresolved: readonly string[];

  private readonly phrases: Phrases;
  private readonly senses: Senses;

  constructor(
    private readonly dictionary: Dictionary,
    private readonly relationships: LexicalRelationshipStore,
    options: DictionaryViewOptions = {},
  ) {
    this.title = options.title ?? "LIRA Dictionary";
    this.domainName = options.domainName ?? "Domain";
    this.unresolved = options.unresolved ?? [];
    this.phrases = options.phrases ?? new Phrases();
    this.senses = options.senses ?? new Senses();
  }

  /** The moment render() is actually called, not construction time --
   * so re-running a seeding script's render() always stamps the instant
   * the page was built, even if the DictionaryView object itself was
   * constructed earlier. */
  private compiledAt(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} UTC`;
  }

  render(): string {
    // Computed directly off the Dictionary/LexicalRelationshipStore,
    // never off wordRecords()/relationshipRecords() -- MAX_INTERACTIVE_WORDS's
    // own docstring on why those two stay accurate even when the full
    // interactive record set below is deliberately skipped.
    const allWords = this.dictionary.all();
    const totalWordCount = allWords.length;
    const totalPhraseCount = this.phrases.totalEntries();
    const totalRelationshipCount = this.relationships.all().length;
    const overCapacity = totalWordCount > MAX_INTERACTIVE_WORDS;
    // A WordNet-seeded Domain's own Phrases is tens of thousands of
    // entries now (WordSeeder.seedWordNet routes every multi-word synset
    // lemma there), not the "a few dozen at most" scale an earlier
    // version of phraseRecords() assumed -- phraseRecords()'s own
    // docstring on why this needs the identical capacity gate `words`
    // above already has, checked against the same MAX_INTERACTIVE_WORDS
    // threshold (there is nothing Phrase-specific about the actual cost
    // this gate exists to avoid -- laying out tens of thousands of <tr>
    // elements in one innerHTML assignment, MAX_WORD_ROWS_SHOWN's own
    // client-side docstring).
    const overCapacityPhrases = totalPhraseCount > MAX_INTERACTIVE_WORDS;
    // Same reasoning as overCapacityPhrases just above, checked against
    // the Senses store's own count -- WordSeeder.seedWordNet seeds one
    // Sense per synset, ~117,800 of them at WordNet scale, well past
    // MAX_INTERACTIVE_WORDS.
    const totalSenseCount = this.senses.totalEntries();
    const overCapacitySenses = totalSenseCount > MAX_INTERACTIVE_WORDS;

    const words = overCapacity ? [] : this.wordRecords();
    const rels = overCapacity ? [] : this.relationshipRecords();
    const phrases = overCapacityPhrases ? [] : this.phraseRecords();
    const senses = overCapacitySenses ? [] : this.senseRecords();
    const commonCount = allWords.filter((w) => w.isCommon).length;
    const posCounts = new Set(allWords.map((w) => w.partOfSpeech));
    // The Words tab's own pos-filter/domain-filter <select> options --
    // computed off allWords, same as the stat tiles above, not off the
    // (possibly capped-empty) `words` WordRecord array: populatePosFilter/
    // populateDomainFilter used to derive their own options by scanning
    // the client-side WORDS array directly, which silently left both
    // filters empty whenever overCapacity emptied that array (a real bug
    // this fixed -- filed against seedWordNet's own WordNet-scale runs,
    // where every dropdown showed nothing at all despite 200,000+ Words
    // actually being there).
    const posValues = [...new Set(allWords.map((w) => PartOfSpeech[w.partOfSpeech]))].sort();
    const domainValues = [...new Set(allWords.map((w) => this.domainLabel(w)).filter((d): d is string => d !== null))].sort();
    // Just two labels are ever possible for one DictionaryView render
    // ("Common" and this.domainName), so a fixed two-color assignment,
    // not a per-domain palette, is enough.
    const domainColors: Record<string, string> = { Common: "#6E7B8B", [this.domainName]: "#2B6E63" };

    let html = PAGE_TEMPLATE;
    const substitutions: Record<string, string> = {
      TITLE: escapeHtml(this.title),
      COMPILED_AT: escapeHtml(this.compiledAt()),
      WORD_COUNT: String(totalWordCount),
      PHRASE_COUNT: String(totalPhraseCount),
      SENSE_COUNT: String(totalSenseCount),
      RELATIONSHIP_COUNT: String(totalRelationshipCount),
      COMMON_COUNT: String(commonCount),
      DOMAIN_SPECIFIC_COUNT: String(totalWordCount - commonCount),
      POS_COUNT: String(posCounts.size),
      UNRESOLVED_COUNT: String(this.unresolved.length),
      WORDS_JSON: JSON.stringify(words),
      PHRASES_JSON: JSON.stringify(phrases),
      SENSES_JSON: JSON.stringify(senses),
      RELS_JSON: JSON.stringify(rels),
      POS_VALUES_JSON: JSON.stringify(posValues),
      DOMAIN_VALUES_JSON: JSON.stringify(domainValues),
      OVER_CAPACITY_JSON: JSON.stringify(overCapacity),
      OVER_CAPACITY_PHRASES_JSON: JSON.stringify(overCapacityPhrases),
      OVER_CAPACITY_SENSES_JSON: JSON.stringify(overCapacitySenses),
      // Over capacity, the Words tab searches the full Dictionary
      // server-side per keystroke (searchWords(), renderWordsOverCapacity()
      // in the fragment's own script below) rather than embedding every
      // Word up front -- so this message now only ever shows on a
      // genuine zero-match search, same as the normal (under-capacity)
      // wording, just naming the real total so a search that finds
      // nothing against 211,000 Words reads differently than one
      // against 40.
      WORDS_EMPTY_MESSAGE: overCapacity
        ? escapeHtml(`No words match this search across all ${totalWordCount.toLocaleString()} words in this Domain.`)
        : "No words match this search.",
      // Same reasoning as WORDS_EMPTY_MESSAGE just above -- the
      // Relationships tab now searches server-side over capacity too
      // (searchRelationships(), renderRelsOverCapacity() below), so
      // this only ever shows on a genuine zero-match search.
      RELS_EMPTY_MESSAGE: overCapacity
        ? escapeHtml(`No relationships match this search across all ${totalRelationshipCount.toLocaleString()} relationships in this Domain.`)
        : "No relationships match this search.",
      // Same reasoning as WORDS_EMPTY_MESSAGE just above -- the Phrases
      // tab now searches server-side over capacity too (searchPhrases(),
      // renderPhrasesOverCapacity() below).
      PHRASES_EMPTY_MESSAGE: overCapacityPhrases
        ? escapeHtml(`No phrases match this search across all ${totalPhraseCount.toLocaleString()} phrases in this Domain.`)
        : "No phrases match this search.",
      // Same reasoning as PHRASES_EMPTY_MESSAGE just above -- the Senses
      // tab now searches server-side over capacity too (searchSenses(),
      // renderSensesOverCapacity() below).
      SENSES_EMPTY_MESSAGE: overCapacitySenses
        ? escapeHtml(`No senses match this search across all ${totalSenseCount.toLocaleString()} senses in this Domain.`)
        : "No senses match this search.",
      UNRESOLVED_JSON: JSON.stringify([...this.unresolved].sort()),
      // The Hierarchy/Cyclic tabs' own "Relationship kind" dropdowns --
      // computed off the full LexicalRelationshipStore regardless of
      // overCapacity, same reasoning as POS_VALUES/DOMAIN_VALUES just
      // above (relationshipKindCounts()'s own docstring: past
      // MAX_INTERACTIVE_WORDS there's no client-embedded RELS array
      // left to scan for kinds at all).
      RELATIONSHIP_KIND_COUNTS_JSON: JSON.stringify(this.relationshipKindCounts()),
      POS_COLORS_JSON: JSON.stringify(POS_COLORS),
      GROUP_COLORS_JSON: JSON.stringify(GROUP_COLORS),
      GROUP_NAMES_JSON: JSON.stringify(GROUP_NAMES),
      DOMAIN_COLORS_JSON: JSON.stringify(domainColors),
    };
    for (const [token, value] of Object.entries(substitutions)) {
      html = html.split(`@@${token}@@`).join(value);
    }
    return html;
  }

  /** [styleCss, bodyHtml, scriptJs] for embedding this view as one tab
   * of a combined page (knowledge/ui/knowledge_view.ts) -- everything
   * this view needs *besides* the shared chrome a combined page only
   * wants once, and besides this view's own masthead. `scriptJs` is
   * returned separately, not concatenated into `bodyHtml`, because the
   * combiner must wrap it in its own scope (an IIFE) before embedding --
   * this view's script declares top-level `const`/`function` names
   * (e.g. `POS_COLORS`) that would collide with another view's script
   * of the same shape if both landed in one global `<script>` block
   * unscoped. */
  renderFragment(): [style: string, body: string, script: string] {
    const html = this.render();
    const style = extractBetween(html, "/*@@STYLE_FRAGMENT_START@@*/", "/*@@STYLE_FRAGMENT_END@@*/");
    const body = extractBetween(html, "<!--@@BODY_FRAGMENT_START@@-->", "<!--@@BODY_FRAGMENT_END@@-->");
    const script = extractBetween(html, "/*@@SCRIPT_FRAGMENT_START@@*/", "/*@@SCRIPT_FRAGMENT_END@@*/");
    return [style, body, script];
  }

  /** Browser-port equivalent of Python's `save(path)` -- there is no
   * filesystem to write a path to, so this triggers a client-side
   * download of the same self-contained HTML render() produces. */
  downloadAsFile(filename = "dictionary.html"): void {
    const blob = new Blob([this.render()], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /** word.uuid.value -> domain label (word.isCommon's own "Common"/
   * domainTag, or this view's own domainName), for every Word in this
   * Dictionary -- Concept-to-Domain lookups for a page composing this
   * view with another (knowledge/ui/knowledge_view.ts), without
   * duplicating domainLabel's own isCommon/domainTag logic. */
  wordDomainLabels(): Map<string, string | null> {
    const labels = new Map<string, string | null>();
    for (const word of this.dictionary.all()) labels.set(word.uuid.value, this.domainLabel(word));
    return labels;
  }

  private wordRecords(): WordRecord[] {
    const records = this.dictionary.all().map((word) => this.wordRecordFor(word));
    records.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
    return records;
  }

  /** One Word's full WordRecord -- everything wordRecords() (the whole-
   * Dictionary path, only ever run under MAX_INTERACTIVE_WORDS) and
   * searchWords() (the single-Word-at-a-time path, run regardless of
   * scale) both build from, so a WordRecord looks identical -- same
   * fields, same relationship_count/definition_segments/pad logic --
   * whichever path produced it. */
  private wordRecordFor(word: Word): WordRecord {
    const wordId = word.uuid.value;
    const relationshipCount = this.relationships.outgoing(wordId).length + this.relationships.incoming(wordId).length;
    const senseFields = this.senseFieldsFor(word);
    return {
      id: wordId,
      entry_id: word.entryId.value,
      lexical_form: word.lexicalForm?.value ?? word.text,
      text: word.text,
      pos: PartOfSpeech[word.partOfSpeech],
      sense_id: word.synsetId?.value ?? null,
      definition: senseFields.definition?.value ?? "",
      gloss: senseFields.gloss?.value ?? "",
      register_codes: word.registerCodes.map((code) => RegisterCode[code]),
      dialect_codes: word.dialectCodes.map((code) => code.value),
      editorial_labels: word.editorialLabels.map((label) => EditorialLabel[label]),
      is_common: word.isCommon,
      is_root_word: this.isRootWordFor(word),
      is_derivable_noun: word.isDerivableNoun,
      domain: this.domainLabel(word),
      related_domains: senseFields.relatedDomainTags.map((tag) => tag.value),
      is_fully_hydrated: word.isFullyHydrated,
      sources: word.sourceReferences.map((ref) => ref.sourceName.value),
      relationship_count: relationshipCount,
      definition_segments: this.definitionSegments(word),
      pad: this.padRecord(word),
      word_forms: this.wordFormsFor(word),
      senses: this.sensesFor(word),
    };
  }

  /** Every Sense `entry` lexicalizes, in `entry.senseIds`'s own order
   * (Word.senseIds's own docstring: ordered by descending
   * Sense.senseFrequency once WordSeeder.seedWordNet's own
   * orderSensesByFrequency has run, so index 0 is always the same Sense
   * senseFieldsFor() already reads for `definition`/`domain` above --
   * `is_primary` marks that one explicitly, rather than leaving the
   * reader to guess whether entry #1 here is special).
   * A senseId that doesn't resolve in this Domain's own Senses (the
   * Physics-from-Common cross-Domain gap senseFieldsFor()'s own
   * docstring already accepts) is skipped, not shown half-empty --
   * every entry returned here has real definition/gloss/domain data to
   * show. `synonyms` is that Sense's own membership (Senses.membersOf()),
   * `entry` itself excluded -- deliberately scoped to just this one
   * Sense, not `entry`'s other, unrelated senses. */
  private sensesFor(entry: Word | Phrase): WordSenseSummary[] {
    const summaries: WordSenseSummary[] = [];
    entry.senseIds.forEach((senseId, index) => {
      const sense = this.senses.findByUuid(senseId.value);
      if (sense === undefined) return;
      const domain = !sense.isCommon ? this.domainName : (sense.domainTag?.value ?? "Common");
      summaries.push({
        id: senseId.value,
        is_primary: index === 0,
        definition: sense.definition?.value ?? "",
        gloss: sense.gloss?.value ?? "",
        domain,
        frequency: sense.senseFrequency ?? null,
        synonyms: this.senses
          .membersOf(senseId.value)
          .filter((member) => member.uuid.value !== entry.uuid.value)
          .map((member) => ({ id: member.uuid.value, text: member.lexicalForm?.value ?? member.text })),
      });
    });
    return summaries;
  }

  /** Every populated *_Form Text field for `word`'s own concrete POS
   * subtype, in the Word Form to Part of Speech Matrix's own field
   * order (data/word_form_part_of_speech_matrix.md) -- baseLemmaCanonicalForm
   * first (every POS subtype carries that one, on Word itself), then
   * whichever of that subtype's own fields are set, read off each POS
   * class's own exported *_FORM_PATTERNS (noun.ts, verb.ts, ...) rather
   * than a duplicated field list of this method's own -- that Record's
   * keys are exactly the *_Form fields that class declares. A field with
   * no populated value is simply absent, not shown as empty. */
  private wordFormsFor(word: Word): WordFormEntry[] {
    const fields: string[] = ["baseLemmaCanonicalForm"];
    if (isNoun(word)) fields.push(...Object.keys(NOUN_FORM_PATTERNS));
    else if (isVerb(word)) fields.push(...Object.keys(VERB_FORM_PATTERNS));
    else if (isAdjective(word)) fields.push(...Object.keys(ADJECTIVE_FORM_PATTERNS));
    else if (isAdverb(word)) fields.push(...Object.keys(ADVERB_FORM_PATTERNS));
    else if (isPronoun(word)) fields.push(...Object.keys(PRONOUN_FORM_PATTERNS));
    else if (isDeterminer(word)) fields.push(...Object.keys(DETERMINER_FORM_PATTERNS));

    const record = word as unknown as Record<string, Text | undefined>;
    const forms: WordFormEntry[] = [];
    for (const field of fields) {
      const text = record[field];
      if (text === undefined) continue;
      forms.push({ field, label: formFieldLabel(field), value: text.value });
    }
    return forms;
  }

  /** Every Phrase in this Domain's Phrases, as a PhraseRecord -- only
   * ever run under MAX_INTERACTIVE_WORDS_PHRASES, the same capacity gate
   * wordRecords() has (render()'s own overCapacityPhrases). A closed-
   * class multi-word entry alone is a few dozen at most
   * (SUPPLEMENTARY_FILES' own scale, word_seeder.ts), but WordSeeder.seedWordNet
   * routes every multi-word synset lemma here too now -- tens of
   * thousands of them at WordNet scale -- so this needs the identical
   * over-capacity treatment wordRecords() already has, not the "a
   * Phrase count never approaches that range" assumption an earlier
   * version of this method made before WordNet-seeded Phrases existed. */
  private phraseRecords(): PhraseRecord[] {
    const records = this.phrases.all().map((phrase) => this.phraseRecordFor(phrase));
    records.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
    return records;
  }

  private phraseRecordFor(phrase: Phrase): PhraseRecord {
    const senseFields = this.senseFieldsFor(phrase);
    return {
      id: phrase.uuid.value,
      entry_id: phrase.entryId.value,
      lexical_form: phrase.lexicalForm?.value ?? phrase.text,
      text: phrase.text,
      pos: PartOfSpeech[phrase.partOfSpeech],
      phrase_type: this.phraseTypeLabel(phrase),
      definition: senseFields.definition?.value ?? "",
      gloss: senseFields.gloss?.value ?? "",
      register_codes: phrase.registerCodes.map((code) => RegisterCode[code]),
      dialect_codes: phrase.dialectCodes.map((code) => code.value),
      editorial_labels: phrase.editorialLabels.map((label) => EditorialLabel[label]),
      is_common: phrase.isCommon,
      sources: phrase.sourceReferences.map((ref) => ref.sourceName.value),
    };
  }

  /** phraseRecords()'s own exact counterpart for the Senses tab -- every
   * Sense in this Domain's Senses store, as a SenseRecord, only ever run
   * under MAX_INTERACTIVE_WORDS (render()'s own overCapacitySenses). */
  private senseRecords(): SenseRecord[] {
    const records = this.senses.all().map((sense) => this.senseRecordFor(sense));
    records.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
    return records;
  }

  /** One Sense's full SenseRecord, including its own membership
   * (`members`/`member_count`/`pos`, resolved via SenseStore.membersOf()) --
   * unlike wordRecordFor()/phraseRecordFor(), this reads every field
   * straight off `sense` itself rather than through senseFieldsFor(),
   * since a Sense already *is* the thing senseFieldsFor() resolves a
   * Word/Phrase through. */
  private senseRecordFor(sense: Sense): SenseRecord {
    const members = this.senses.membersOf(sense.uuid.value);
    const domain = !sense.isCommon ? this.domainName : (sense.domainTag?.value ?? "Common");
    return {
      id: sense.uuid.value,
      entry_id: sense.entryId.value,
      synset_id: sense.synsetId?.value ?? null,
      lexical_form: members.map((member) => member.lexicalForm?.value ?? member.text).join(", "),
      pos: members.length > 0 ? PartOfSpeech[members[0].partOfSpeech] : null,
      gloss: sense.gloss?.value ?? "",
      definition: sense.definition?.value ?? "",
      is_common: sense.isCommon,
      is_root_word: sense.isRootWord,
      domain,
      related_domains: sense.relatedDomainTags.map((tag) => tag.value),
      member_count: members.length,
      members: members.map((member) => member.lexicalForm?.value ?? member.text),
      sources: sense.sourceReferences.map((ref) => ref.sourceName.value),
      sense_frequency: sense.senseFrequency ?? null,
    };
  }

  /** Resolves a Words-tab search against every Word in the Dictionary
   * directly, rather than against a pre-embedded client-side array --
   * the on-demand counterpart to wordRecords() for a Domain over
   * MAX_INTERACTIVE_WORDS, where embedding every Word up front isn't an
   * option (that constant's own docstring). Matching semantics
   * (case-insensitive substring on lexical_form/gloss/definition, exact
   * pos/domain, is_root_word) mirror the fragment's own client-side
   * matchesQuery()/filteredWords() exactly, so a search behaves the same
   * whether it ran client-side (a small Domain) or here (a large one).
   *
   * A linear scan over the whole Dictionary -- for the ~211,000-Word
   * scale this exists for, that's tens of milliseconds of plain string
   * comparisons, nowhere near the cost embedding every Word's full
   * WordRecord (and then JSON.stringify-ing the result) would be.
   * `words` is capped at `options.limit`; `totalMatches` is the true
   * count of everything that matched, uncapped, so a caller can show
   * "showing N of totalMatches" the same way MAX_WORD_ROWS_SHOWN's
   * client-side note already does.
   *
   * `wordId`, if given, bypasses every other filter for an O(1) exact
   * lookup (Dictionary.findByUuid) instead of the linear scan below --
   * the detail panel's own need to resolve a related word clicked from
   * inside itself (a pivot button carries only that word's id, never
   * enough to search by) that isn't already one of the currently-shown
   * Words (WORDS, empty over capacity, or the last search's own
   * results) -- dictionary_view.ts's own client-side
   * lookupWordForDetailPanel(). */
  searchWords(options: {
    wordId?: string;
    word?: string;
    gloss?: string;
    definition?: string;
    pos?: string;
    domain?: string;
    rootWordsOnly?: boolean;
    limit?: number;
  }): { words: WordRecord[]; totalMatches: number } {
    if (options.wordId !== undefined) {
      // Checked directly against the Phrase itself, not via
      // resolveEntry()'s own Word-shaped projection -- phraseAsWord()
      // deliberately doesn't carry a Phrase's own `words` references
      // (a plain Word has no sub-word composition to project), so
      // building the phrase_word_segments a Phrase's own detail-panel
      // headword needs (phraseWordSegments()'s own docstring) requires
      // the original Phrase, not just its Word-shaped view.
      const phrase = this.phrases.findByUuid(options.wordId);
      if (phrase !== undefined) {
        const record = this.wordRecordFor(phraseAsWord(phrase));
        return {
          words: [{ ...record, phrase_word_segments: this.phraseWordSegments(phrase), phrase_type: this.phraseTypeLabel(phrase) }],
          totalMatches: 1,
        };
      }
      const word = this.dictionary.findByUuid(options.wordId);
      if (word !== undefined) return { words: [this.wordRecordFor(word)], totalMatches: 1 };
      // `wordId` may also name a Sense directly -- the Senses tab's own
      // row-click (senseRecordFor()'s own `id`), resolved to its first-
      // registered member the same way resolveEntry() below falls back
      // to a representative member for a Sense-typed relationship
      // endpoint (that method's own docstring). Reuses this same
      // branch's own Phrase-vs-Word handling for whichever kind the
      // representative turns out to be, so a Sense whose one member is a
      // Phrase still gets its own phrase_word_segments.
      const sense = this.senses.findByUuid(options.wordId);
      const representative = sense !== undefined ? this.senses.membersOf(sense.uuid.value)[0] : undefined;
      if (representative !== undefined) {
        if ("words" in representative) {
          const record = this.wordRecordFor(phraseAsWord(representative));
          return {
            words: [{ ...record, phrase_word_segments: this.phraseWordSegments(representative), phrase_type: this.phraseTypeLabel(representative) }],
            totalMatches: 1,
          };
        }
        return { words: [this.wordRecordFor(representative)], totalMatches: 1 };
      }
      return { words: [], totalMatches: 0 };
    }

    const limit = options.limit ?? 1000;
    const wordQuery = options.word?.trim().toLowerCase();
    const glossQuery = options.gloss?.trim().toLowerCase();
    const definitionQuery = options.definition?.trim().toLowerCase();

    const matches: WordRecord[] = [];
    let totalMatches = 0;
    for (const word of this.dictionary.all()) {
      if (options.pos && PartOfSpeech[word.partOfSpeech] !== options.pos) continue;
      if (options.rootWordsOnly && !this.isRootWordFor(word)) continue;
      if (options.domain && this.domainLabel(word) !== options.domain) continue;
      const lexicalForm = (word.lexicalForm?.value ?? word.text).toLowerCase();
      if (wordQuery && !lexicalForm.includes(wordQuery)) continue;
      if (glossQuery && !(word.gloss?.value ?? "").toLowerCase().includes(glossQuery)) continue;
      if (definitionQuery && !(word.definition?.value ?? "").toLowerCase().includes(definitionQuery)) continue;

      totalMatches += 1;
      if (matches.length < limit) matches.push(this.wordRecordFor(word));
    }
    matches.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
    return { words: matches, totalMatches };
  }

  /** searchWords()'s own counterpart for the Phrases tab, over
   * MAX_INTERACTIVE_WORDS_PHRASES -- resolves a search against every
   * Phrase in the Phrases directly instead of a pre-embedded
   * client-side array, the same reasoning searchWords() itself
   * documents. Matching semantics (case-insensitive substring on
   * lexical_form/gloss/definition, exact pos) mirror the fragment's own
   * client-side matchesPhraseQuery()/filteredPhrases() exactly, so a
   * search behaves the same whether it ran client-side (a small
   * Phrases) or here (WordNet scale, tens of thousands of Phrases).
   * `phrases` is capped at `options.limit`; `totalMatches` is the true,
   * uncapped count. */
  searchPhrases(options: { word?: string; gloss?: string; definition?: string; pos?: string; limit?: number }): {
    phrases: PhraseRecord[];
    totalMatches: number;
  } {
    const limit = options.limit ?? 1000;
    const wordQuery = options.word?.trim().toLowerCase();
    const glossQuery = options.gloss?.trim().toLowerCase();
    const definitionQuery = options.definition?.trim().toLowerCase();

    const matches: PhraseRecord[] = [];
    let totalMatches = 0;
    for (const phrase of this.phrases.all()) {
      if (options.pos && PartOfSpeech[phrase.partOfSpeech] !== options.pos) continue;
      const lexicalForm = (phrase.lexicalForm?.value ?? phrase.text).toLowerCase();
      if (wordQuery && !lexicalForm.includes(wordQuery)) continue;
      if (glossQuery && !(phrase.gloss?.value ?? "").toLowerCase().includes(glossQuery)) continue;
      if (definitionQuery && !(phrase.definition?.value ?? "").toLowerCase().includes(definitionQuery)) continue;

      totalMatches += 1;
      if (matches.length < limit) matches.push(this.phraseRecordFor(phrase));
    }
    matches.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
    return { phrases: matches, totalMatches };
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
  searchSenses(options: { word?: string; gloss?: string; definition?: string; pos?: string; limit?: number }): {
    senses: SenseRecord[];
    totalMatches: number;
  } {
    const limit = options.limit ?? 1000;
    const wordQuery = options.word?.trim().toLowerCase();
    const glossQuery = options.gloss?.trim().toLowerCase();
    const definitionQuery = options.definition?.trim().toLowerCase();

    const matches: SenseRecord[] = [];
    let totalMatches = 0;
    for (const sense of this.senses.all()) {
      if (glossQuery && !(sense.gloss?.value ?? "").toLowerCase().includes(glossQuery)) continue;
      if (definitionQuery && !(sense.definition?.value ?? "").toLowerCase().includes(definitionQuery)) continue;
      const record = this.senseRecordFor(sense);
      if (options.pos && record.pos !== options.pos) continue;
      if (wordQuery && !record.lexical_form.toLowerCase().includes(wordQuery)) continue;

      totalMatches += 1;
      if (matches.length < limit) matches.push(record);
    }
    matches.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
    return { senses: matches, totalMatches };
  }

  /** `entry`'s own primary Sense's own Seeded Attributes for the PAD
   * (Pleasure-Arousal-Dominance) affective framework -- PAD lives on
   * Sense now, not on Word/Phrase directly (Sense.seededPleasureDispleasureWeight's
   * own docstring, data/sense.ts), so this resolves through
   * `entry.senseIds[0]` the same way senseFieldsFor()/isRootWordFor() do
   * (their own docstrings on why index 0 specifically). null when
   * there's no resolvable Sense at all, or its own PAD fields are
   * undefined (no PAD value has ever been assigned to this meaning) --
   * 0.0 is a genuine "neutral" value, distinct from either. Unlike
   * senseFieldsFor()'s own domainTag/relatedDomainTags, there is no
   * Word/Phrase-level fallback to fall back to any more -- a Word/Phrase
   * copied cross-Domain without its own Sense (that same known gap)
   * simply shows no PAD here. */
  private padRecord(entry: Word | Phrase): { pleasure: number; arousal: number; dominance: number } | null {
    const primarySenseId = entry.senseIds[0];
    const sense = primarySenseId !== undefined ? this.senses.findByUuid(primarySenseId.value) : undefined;
    if (sense === undefined) return null;
    const { seededPleasureDispleasureWeight: p, seededArousalNonArousalWeight: a, seededDominanceSubmissiveWeight: d } = sense;
    if (p === undefined || a === undefined || d === undefined) return null;
    return { pleasure: p.value, arousal: a.value, dominance: d.value };
  }

  /** Reconstructs word.definition's text as an ordered list of
   * segments -- plain text (punctuation, whitespace) interleaved with
   * word-token segments carrying each token's own resolution from
   * definitionWords() -- so the detail panel can render the definition
   * with each word individually identifiable (a tooltip popup), without
   * re-deriving the resolution itself in client JS. Empty when there's
   * no definition. */
  private definitionSegments(word: Word): DefinitionSegment[] {
    if (word.definition === undefined) return [];
    const text = word.definition.value;
    const references = definitionWords(word, this.dictionary);
    const segments: DefinitionSegment[] = [];
    let lastEnd = 0;
    let referenceIndex = 0;
    for (const match of text.matchAll(DEFINITION_TOKEN_PATTERN)) {
      const reference = references[referenceIndex];
      if (reference === undefined) break;
      referenceIndex += 1;
      const start = match.index ?? 0;
      if (start > lastEnd) segments.push({ text: text.slice(lastEnd, start) });
      segments.push(this.definitionWordSegment(match[0], reference.word));
      lastEnd = start + match[0].length;
    }
    if (lastEnd < text.length) segments.push({ text: text.slice(lastEnd) });
    return segments;
  }

  /** `phrase`'s own headword (`text`) broken into one DefinitionSegment
   * per whitespace token, in the same order phrase.words itself was
   * populated (WordSeeder.seedWordNet's own linkPhraseWords()) --
   * reusing definitionWordSegment() as-is, so a Phrase's own headword
   * links to its constituent Words exactly the way a Word's own
   * definition text already links to the Words *it* mentions (same
   * hover-tooltip rendering client-side, dictionary_view.ts's own
   * definitionSegmentHTML). Reads the already-stored uuid references
   * directly (Dictionary.findByUuid) rather than re-splitting `text`
   * and re-resolving each token against `dictionary` from scratch --
   * the whole reason those references were stored ahead of time. */
  private phraseWordSegments(phrase: Phrase): DefinitionSegment[] {
    const tokens = phrase.text.trim().split(/\s+/).filter((token) => token.length > 0);
    return tokens.map((token, index) => {
      const ref = phrase.words[index];
      const resolved = ref !== undefined ? this.dictionary.findByUuid(ref.value) : undefined;
      return this.definitionWordSegment(token, resolved);
    });
  }

  /** `phrase`'s own phraseType, as the enum's own key string (`pos`'s
   * own PhraseType[...] convention, WordRecord.phrase_type's own
   * docstring) -- `undefined` for a Phrase whose phraseType is itself
   * undefined (every Common Vocabulary Cache closed-class Phrase, and
   * any WordNet-seeded one classifyPhraseType() couldn't classify),
   * kept as its own small method purely so both wordId-resolution call
   * sites above read the identical one-liner phraseWordSegments()
   * already gets its own for. */
  private phraseTypeLabel(phrase: Phrase): string | undefined {
    return phrase.phraseType !== undefined ? PhraseType[phrase.phraseType] : undefined;
  }

  private definitionWordSegment(surfaceText: string, resolved: Word | undefined): DefinitionSegment {
    if (resolved === undefined) return { text: surfaceText, word: true, resolved: false };
    return {
      text: surfaceText,
      word: true,
      resolved: true,
      word_id: resolved.uuid.value,
      lexical_form: resolved.lexicalForm?.value ?? resolved.text,
      pos: PartOfSpeech[resolved.partOfSpeech],
      domain: this.domainLabel(resolved),
      gloss: resolved.gloss?.value ?? resolved.definition?.value ?? "",
    };
  }

  /** Resolves a relationship endpoint's uuid against this Domain's
   * Dictionary first, falling back to its Phrases (projected onto a
   * Word-shaped view via phraseAsWord(), preserving the Phrase's own
   * uuid) only if the Dictionary lookup fails -- a WordNet-seeded
   * multi-word synset member (word_seeder.ts's own seedWordNet) can be
   * either end of a LexicalRelationship exactly like a single-word
   * member, so every place that used to assume "every relationship
   * endpoint is a Word in this Dictionary" needs this instead of a bare
   * `dictionary.findByUuid` call.
   *
   * Falls back to Senses last, only once both Dictionary and
   * Phrases have failed: a synset-wide Lexical Semantic fact is now
   * stored as a Sense-to-Sense edge, not a Word/Phrase-to-Word/Phrase one
   * (WordSeeder.seedPointerRelationship's own docstring), so `id` can
   * legitimately name a Sense rather than either. Resolved to that
   * Sense's own first-registered member (Senses.membersOf()) as a
   * representative -- a deliberate simplification for this single-row
   * display path, not a claim that member is somehow more "the" word
   * than any of its fellow synonyms; searchRelationships()'s own
   * `wordId` path expands a Sense edge out to every member instead of
   * picking just one, since that path already has the querying Word on
   * hand to reconstruct the full fan-out around. */
  private resolveEntry(id: string): Word | undefined {
    const word = this.dictionary.findByUuid(id);
    if (word !== undefined) return word;
    const phrase = this.phrases.findByUuid(id);
    if (phrase !== undefined) return phraseAsWord(phrase);
    const sense = this.senses.findByUuid(id);
    if (sense === undefined) return undefined;
    const representative = this.senses.membersOf(sense.uuid.value)[0];
    if (representative === undefined) return undefined;
    return "words" in representative ? phraseAsWord(representative) : representative;
  }

  private relationshipRecords(): RelationshipRecord[] {
    return this.relationships.all().map((rel) => this.relationshipRecordFor(rel));
  }

  /** One LexicalRelationship's full RelationshipRecord -- shared by
   * relationshipRecords() (the whole-store path, only ever run under
   * MAX_INTERACTIVE_WORDS) and searchRelationships() (resolved
   * relationship-by-relationship regardless of scale), same reasoning
   * as wordRecordFor()/wordRecords(). */
  private relationshipRecordFor(rel: LexicalRelationship): RelationshipRecord {
    const source = this.resolveEntry(rel.sourceWordId.value);
    const target = this.resolveEntry(rel.targetWordId.value);
    return {
      id: rel.uuid.value,
      source_id: rel.sourceWordId.value,
      source_text: source?.text ?? "?",
      source_pos: source ? PartOfSpeech[source.partOfSpeech] : null,
      source_domain: this.domainLabel(source),
      source_sense_id: source?.synsetId?.value ?? null,
      target_id: rel.targetWordId.value,
      target_text: target?.text ?? "?",
      target_pos: target ? PartOfSpeech[target.partOfSpeech] : null,
      target_domain: this.domainLabel(target),
      target_sense_id: target?.synsetId?.value ?? null,
      kind: LexicalRelationshipType[rel.relationshipType],
      group: relationshipGroup(rel.relationshipType),
      category: relationshipCategory(rel.relationshipType),
      confidence: Math.round(rel.systemProperties.confidenceWeight * 10000) / 10000,
      qualifier: rel.qualifiers.find((q) => q.name.value === MERONYM_KIND_QUALIFIER)?.value.value ?? null,
      via_sense_id: null,
    };
  }

  /** Resolves a Relationships-tab search (or, given `wordId`, "every
   * relationship touching this one Word" -- the Words-tab detail
   * panel's own need, over MAX_INTERACTIVE_WORDS) on demand, the
   * relationship-side counterpart to searchWords() (that method's own
   * docstring). `wordId` takes the fast path: LexicalRelationshipStore's
   * own outgoing()/incoming() are O(1) indexed (lexical_relationship_store.ts's
   * own docstring), so looking up one Word's relationships never scans
   * the whole store, however large it's grown -- unlike a `query`-only
   * or unfiltered search, which does (still just a linear scan of plain
   * string comparisons, tens to low hundreds of milliseconds even at
   * WordNet's ~1,260,000-relationship scale, nowhere near
   * MAX_INTERACTIVE_WORDS's own JSON.stringify ceiling since nothing
   * here embeds the result, only returns a capped slice of it). */
  /** `wordId`'s own Sense-level relationships, expanded back out to one
   * synthetic LexicalRelationship per fellow member of the Sense on the
   * *other* end -- searchRelationships()'s own fast path needs this
   * because `this.relationships.outgoing(wordId)`/`incoming(wordId)`
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
  private senseExpandedRelationships(word: Word): { relationships: readonly LexicalRelationship[]; viaSenseId: ReadonlyMap<string, string> } {
    const expanded: LexicalRelationship[] = [];
    const viaSenseId = new Map<string, string>();
    for (const ownSenseId of word.senseIds) {
      const senseId = ownSenseId.value;
      for (const rel of [...this.relationships.outgoing(senseId), ...this.relationships.incoming(senseId)]) {
        const outgoingFromSense = rel.sourceWordId.value === senseId;
        const otherSenseId = outgoingFromSense ? rel.targetWordId.value : rel.sourceWordId.value;
        for (const member of this.senses.membersOf(otherSenseId)) {
          const uuid = { value: `${rel.uuid.value}:${member.uuid.value}` };
          expanded.push({
            ...rel,
            uuid,
            sourceWordId: outgoingFromSense ? { value: word.uuid.value } : member.uuid,
            targetWordId: outgoingFromSense ? member.uuid : { value: word.uuid.value },
          });
          viaSenseId.set(uuid.value, senseId);
        }
      }
    }
    return { relationships: expanded, viaSenseId };
  }

  searchRelationships(options: { wordId?: string; query?: string; limit?: number }): { relationships: RelationshipRecord[]; totalMatches: number } {
    const limit = options.limit ?? 1000;
    const query = options.query?.trim().toLowerCase();
    let candidates: readonly LexicalRelationship[];
    let viaSenseId: ReadonlyMap<string, string> = new Map();
    if (options.wordId !== undefined) {
      const word = this.resolveEntry(options.wordId);
      const senseExpanded = word !== undefined ? this.senseExpandedRelationships(word) : { relationships: [], viaSenseId: new Map() };
      candidates = [...this.relationships.outgoing(options.wordId), ...this.relationships.incoming(options.wordId), ...senseExpanded.relationships];
      viaSenseId = senseExpanded.viaSenseId;
    } else {
      candidates = this.relationships.all();
    }

    const matches: RelationshipRecord[] = [];
    let totalMatches = 0;
    for (const rel of candidates) {
      const record = this.relationshipRecordFor(rel);
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
   * (renderFragment()'s own POS_VALUES/DOMAIN_VALUES precedent), so the
   * Hierarchy/Cyclic tabs' own "Relationship kind" dropdowns have
   * something to populate from even past MAX_INTERACTIVE_WORDS, where
   * the client-side RELS array they used to read from is always empty. */
  relationshipKindCounts(): RelationshipKindCount[] {
    const counts = new Map<string, { group: number; count: number }>();
    for (const rel of this.relationships.all()) {
      const kind = LexicalRelationshipType[rel.relationshipType];
      const entry = counts.get(kind);
      if (entry) entry.count += 1;
      else counts.set(kind, { group: relationshipGroup(rel.relationshipType), count: 1 });
    }
    return [...counts.entries()].map(([kind, v]) => ({ kind, group: v.group, count: v.count }));
  }

  /** Resolves one Hierarchy-tab tree for `options.kind`, server-side,
   * regardless of scale -- the on-demand counterpart to the small-
   * Domain client-side buildHierarchy() (dictionary_view.ts's own
   * embedded script), for a Domain over MAX_INTERACTIVE_WORDS where
   * there's no client-embedded RELS array left to build a tree from in
   * the browser at all (that constant's own docstring).
   *
   * Two modes, chosen by whether `options.wordId` is given:
   *  - No wordId: finds this kind's own "broadest root" -- among every
   *    node with no parent edge of this kind, the one with the most
   *    total *reachable descendants* (not merely the most direct
   *    children -- an earlier version of this method used that cheaper
   *    but misleading proxy: WordNet's own verb taxonomy is much
   *    shallower than its noun one, so a broad verb concept like
   *    "change" can have more direct hyponyms than "entity" does, while
   *    entity's own subtree still covers the overwhelming majority of
   *    every noun in the Dictionary). Computed via one memoized DFS
   *    shared across every candidate (subtreeSize() below), not one
   *    traversal per candidate, so this stays O(nodes + edges) overall
   *    even when there are many root candidates -- then returns that
   *    root's own descendant subtree, breadth-first, capped at
   *    `options.limit` nodes.
   *  - `wordId` given: walks *up* from that Word, one parent at a time
   *    (the first parent found at each step -- a rare multiple-parent
   *    case, e.g. a noun with two WordNet hypernyms, picks one path
   *    rather than returning a merged DAG of ancestors), to build the
   *    root-to-word ancestor chain, then returns that Word's own
   *    descendant subtree the same breadth-first, capped way.
   *
   * HIERARCHY_INVERTED_KINDS's own docstring on why `parentId`/`childId`
   * aren't always simply `sourceWordId`/`targetWordId`. Every edge of
   * the chosen kind is scanned once regardless of mode
   * (`this.relationships.all()` filtered by kind) -- at WordNet scale
   * that's up to a few hundred thousand comparisons, comfortably
   * sub-second work for an on-demand Worker request, the same order of
   * magnitude searchWords()/searchRelationships() already do per call.
   * `fellBack: true` means every node touched by this kind has both
   * directions (a fully symmetric kind, e.g. ANTONYM) -- there is no
   * meaningful root to start from; a caller should offer its own
   * clustering view instead (buildClusters()'s own small-Domain
   * equivalent) rather than treat this as "no data". `truncated: true`
   * means the descendant walk hit `options.limit` before it ran out of
   * children to include. */
  resolveHierarchy(options: { kind: string; wordId?: string; limit?: number }): HierarchyResolution {
    const empty: HierarchyResolution = { nodes: [], edges: [], roots: [], totalEdgeCount: 0, totalNodeCount: 0, fellBack: false, truncated: false };
    const kindEnum = LexicalRelationshipType[options.kind as keyof typeof LexicalRelationshipType];
    if (kindEnum === undefined) return empty;

    const inverted = HIERARCHY_INVERTED_KINDS.has(kindEnum);
    const limit = options.limit ?? DEFAULT_HIERARCHY_NODE_LIMIT;

    const childrenOf = new Map<string, Set<string>>();
    const parentsOf = new Map<string, Set<string>>();
    const allNodeIds = new Set<string>();
    let totalEdgeCount = 0;
    for (const rel of this.relationships.all()) {
      if (rel.relationshipType !== kindEnum) continue;
      totalEdgeCount += 1;
      const parentId = inverted ? rel.targetWordId.value : rel.sourceWordId.value;
      const childId = inverted ? rel.sourceWordId.value : rel.targetWordId.value;
      allNodeIds.add(parentId);
      allNodeIds.add(childId);
      let children = childrenOf.get(parentId);
      if (!children) {
        children = new Set();
        childrenOf.set(parentId, children);
      }
      children.add(childId);
      let parents = parentsOf.get(childId);
      if (!parents) {
        parents = new Set();
        parentsOf.set(childId, parents);
      }
      parents.add(parentId);
    }
    const totalNodeCount = allNodeIds.size;
    if (totalEdgeCount === 0) return empty;
    // Checked by kind, not inferred from the stored edge shape --
    // SYMMETRIC_HIERARCHY_KINDS's own docstring on why
    // `rootCandidates.length === 0` alone no longer reliably detects
    // this. Applies regardless of `wordId`: a "centred" tree makes no
    // more sense for a symmetric kind with a word selected than without
    // one, and the cluster view this falls back to (buildClusters()'s
    // own client-side equivalent) doesn't take a centring word anyway.
    if (SYMMETRIC_HIERARCHY_KINDS.has(kindEnum)) return { ...empty, totalEdgeCount, totalNodeCount, fellBack: true };

    const ancestorChain: string[] = [];
    let startId: string;

    if (options.wordId !== undefined) {
      // `options.wordId` names a Word/Phrase, but this kind's own graph
      // (`allNodeIds`, built from `this.relationships.all()` just above)
      // can be keyed by Sense uuid instead for a synset-wide Lexical
      // Semantic kind (WordSeeder.seedPointerRelationship's own
      // docstring) -- if the Word/Phrase's own uuid isn't a node, fall
      // back to its Sense's uuid before giving up. The tree then centres
      // on that Sense (rendered via resolveEntry()'s own representative-
      // member simplification below), not literally `options.wordId`
      // itself, whenever the two differ -- a deliberate simplification,
      // the same one searchRelationships() avoids by fanning out instead
      // (senseExpandedRelationships()'s own docstring), acceptable here
      // since a Hierarchy tree already collapses a whole synset onto one
      // node by design.
      let cur = options.wordId;
      if (!allNodeIds.has(cur)) {
        // senseIds[0] -- the primary, highest-Sense.senseFrequency sense
        // (Word.senseIds's own docstring) -- same "collapse a whole synset onto one node"
        // simplification this fallback already documents above.
        const senseId = this.resolveEntry(options.wordId)?.senseIds[0]?.value;
        if (senseId !== undefined && allNodeIds.has(senseId)) cur = senseId;
      }
      if (!allNodeIds.has(cur)) return { ...empty, totalEdgeCount, totalNodeCount };
      startId = cur;
      const seen = new Set([cur]);
      for (;;) {
        const parents = parentsOf.get(cur);
        if (!parents || parents.size === 0) break;
        const next = [...parents][0];
        if (seen.has(next)) break;
        ancestorChain.push(next);
        seen.add(next);
        cur = next;
      }
      ancestorChain.reverse();
    } else {
      const rootCandidates = [...allNodeIds].filter((id) => !parentsOf.has(id));
      if (rootCandidates.length === 0) return { ...empty, totalEdgeCount, totalNodeCount, fellBack: true };

      // Reachable-descendant count, memoized once per node and reused
      // across every root candidate's own comparison below -- this
      // method's own docstring on why (a cheap per-candidate proxy like
      // direct-child-count picks a shallow-but-wide root instead of the
      // genuinely broadest one). A DAG's rare multiply-inherited node
      // (a WordNet synset with two hypernyms) gets counted under each of
      // its parents -- a defensible approximation for "which root is
      // broadest", not a guarantee every count is a distinct
      // reachable-node total.
      const subtreeSize = new Map<string, number>();
      const computing = new Set<string>();
      const sizeOf = (id: string): number => {
        const cached = subtreeSize.get(id);
        if (cached !== undefined) return cached;
        if (computing.has(id)) return 0; // cycle guard
        computing.add(id);
        let size = 1;
        for (const child of childrenOf.get(id) ?? []) size += sizeOf(child);
        computing.delete(id);
        subtreeSize.set(id, size);
        return size;
      };
      rootCandidates.sort((a, b) => sizeOf(b) - sizeOf(a));
      startId = rootCandidates[0];
    }

    const includedIds = new Set<string>(ancestorChain);
    includedIds.add(startId);
    const edges: HierarchyEdge[] = [];
    for (let i = 0; i < ancestorChain.length - 1; i++) {
      edges.push({ parentId: ancestorChain[i], childId: ancestorChain[i + 1] });
    }
    if (ancestorChain.length > 0) {
      edges.push({ parentId: ancestorChain[ancestorChain.length - 1], childId: startId });
    }

    let truncated = false;
    const queue: string[] = [startId];
    let queueIndex = 0;
    while (queueIndex < queue.length) {
      const current = queue[queueIndex];
      queueIndex += 1;
      const children = childrenOf.get(current);
      if (!children) continue;
      for (const childId of children) {
        const alreadyIncluded = includedIds.has(childId);
        if (!alreadyIncluded && includedIds.size >= limit) {
          truncated = true;
          continue;
        }
        edges.push({ parentId: current, childId });
        if (!alreadyIncluded) {
          includedIds.add(childId);
          queue.push(childId);
        }
      }
    }

    const nodes: HierarchyNode[] = [];
    for (const id of includedIds) {
      const word = this.resolveEntry(id);
      if (!word) continue;
      nodes.push({
        id,
        lexical_form: word.lexicalForm?.value ?? word.text,
        pos: PartOfSpeech[word.partOfSpeech],
        domain: this.domainLabel(word),
        sense_id: word.synsetId?.value ?? null,
      });
    }

    const roots = ancestorChain.length > 0 ? [ancestorChain[0]] : [startId];
    return { nodes, edges, roots, totalEdgeCount, totalNodeCount, fellBack: false, truncated };
  }

  /** The Sense-owned fields that actually apply to `entry` (a Word or a
   * Phrase) -- domainTag/relatedDomainTags, definition/gloss/usageNotes
   * -- preferring its own Sense (WordSeeder's own tagTopicDomain,
   * seedWordNet's own createSense call, and registerUniqueSense all
   * populate a Sense with the identical values `entry`'s own fields
   * already carry, WordNet-sourced and hand-curated alike -- sense.ts's
   * own docstring) and falling back to `entry`'s own fields only when
   * its senseId doesn't resolve in this Domain's own Senses. That
   * fallback isn't just defensive: a Word/Phrase copied into a different
   * Domain (VocabularyLayer's own Physics-from-Common bootstrap, in
   * particular) doesn't yet carry a matching Sense copy across into that
   * Domain's own Senses -- a known, accepted gap, the same one
   * LexicalRelationshipStore already has for a cross-domain copy -- so
   * `entry`'s own fields (never stripped, unlike WordNet's own
   * domainTag/relatedDomainTags) are what keeps a Physics-side word's
   * own definition/domain/etc. correct regardless. */
  private senseFieldsFor(entry: Word | Phrase): {
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
    const sense = primarySenseId !== undefined ? this.senses.findByUuid(primarySenseId.value) : undefined;
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
  private isRootWordFor(word: Word): boolean {
    const primarySenseId = word.senseIds[0];
    const sense = primarySenseId !== undefined ? this.senses.findByUuid(primarySenseId.value) : undefined;
    return sense?.isRootWord ?? word.isRootWord;
  }

  private domainLabel(word: Word | undefined): string | null {
    if (word === undefined) return null;
    if (!word.isCommon) return this.domainName;
    // A genuine polyseme's domainTag ("symbol.common") names its own
    // sense-disambiguating subdomain; every other Common word reads as
    // plain "Common", same as before this field existed.
    return this.senseFieldsFor(word).domainTag?.value ?? "Common";
  }
}

const PAGE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@@TITLE@@ -- compiled @@COMPILED_AT@@</title>
<style>
:root {
  --ground: #F4F5F1;
  --surface: #FFFFFF;
  --ink: #1C2321;
  --ink-muted: #5B6660;
  --accent: #2B6E63;
  --accent-ink: #FFFFFF;
  --line: #DDE0DA;
  --line-strong: #C4C9BF;
  --shadow: 0 1px 2px rgba(28, 35, 33, 0.06), 0 4px 12px rgba(28, 35, 33, 0.04);
  --radius: 6px;
  --font-display: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: 'SF Mono', 'Cascadia Code', Consolas, 'Liberation Mono', Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --ground: #12211D;
    --surface: #182A24;
    --ink: #E7EEEA;
    --ink-muted: #90A69D;
    --accent: #4FBBA6;
    --accent-ink: #0B1613;
    --line: #2A3B34;
    --line-strong: #3B4F47;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25);
  }
}
:root[data-theme="dark"] {
  --ground: #12211D;
  --surface: #182A24;
  --ink: #E7EEEA;
  --ink-muted: #90A69D;
  --accent: #4FBBA6;
  --accent-ink: #0B1613;
  --line: #2A3B34;
  --line-strong: #3B4F47;
  --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25);
}
:root[data-theme="light"] {
  --ground: #F4F5F1;
  --surface: #FFFFFF;
  --ink: #1C2321;
  --ink-muted: #5B6660;
  --accent: #2B6E63;
  --accent-ink: #FFFFFF;
  --line: #DDE0DA;
  --line-strong: #C4C9BF;
  --shadow: 0 1px 2px rgba(28, 35, 33, 0.06), 0 4px 12px rgba(28, 35, 33, 0.04);
}
* { box-sizing: border-box; }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
html, body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--font-body);
}
body {
  padding: 32px clamp(16px, 4vw, 48px) 64px;
}
.page { max-width: 1180px; margin: 0 auto; }
header.masthead {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line-strong);
  margin-bottom: 24px;
}
h1 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 2rem;
  margin: 0;
  text-wrap: balance;
  letter-spacing: -0.01em;
}
.masthead .subtitle {
  font-size: 0.9rem;
  color: var(--ink-muted);
}
/* Everything below, to the matching end marker, is this view's own
   page-specific CSS -- render_fragment() (below) extracts it for
   embedding in a combined page (knowledge/ui/lira_view.py) on top of
   the shared chrome (:root tokens, reset, masthead) above, which such
   a page only needs once. */
/*@@STYLE_FRAGMENT_START@@*/
.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.stat {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px 16px;
  box-shadow: var(--shadow);
}
.stat .value {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.stat .label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  margin-top: 4px;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.search-field {
  flex: 1 1 260px;
  position: relative;
}
.search-field input {
  width: 100%;
  padding: 9px 12px 9px 34px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.92rem;
}
.search-field input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
.search-field::before {
  content: "";
  position: absolute;
  left: 11px;
  top: 50%;
  width: 13px;
  height: 13px;
  transform: translateY(-50%);
  border: 1.5px solid var(--ink-muted);
  border-radius: 50%;
  box-shadow: 4px 4px 0 -2px var(--ink-muted);
}
select#pos-filter, select#domain-filter {
  padding: 9px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.88rem;
}
.root-word-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--ink-muted);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.root-word-toggle-label input { accent-color: var(--accent); cursor: pointer; margin: 0; }
.tabs {
  display: inline-flex;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  overflow: hidden;
}
.tabs button {
  border: none;
  background: var(--surface);
  color: var(--ink-muted);
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 9px 16px;
  cursor: pointer;
}
.tabs button + button { border-left: 1px solid var(--line-strong); }
.tabs button[aria-selected="true"] {
  background: var(--accent);
  color: var(--accent-ink);
}
.tabs button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.panel { display: none; }
.panel.active { display: block; }
.table-wrap {
  overflow-x: auto;
  overflow-y: auto;
  max-height: min(65vh, 640px);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}
table { width: 100%; border-collapse: collapse; font-size: 0.87rem; }
thead th {
  position: sticky;
  top: 0;
  background: var(--surface);
  text-align: left;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-muted);
  padding: 10px 14px;
  border-bottom: 1px solid var(--line-strong);
  cursor: pointer;
  white-space: nowrap;
}
thead th:hover { color: var(--ink); }
thead th .arrow { opacity: 0.5; margin-left: 3px; }
tbody td {
  padding: 9px 14px;
  border-bottom: 1px solid var(--line);
  vertical-align: top;
}
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: color-mix(in srgb, var(--accent) 6%, transparent); }
.word-form {
  font-family: var(--font-mono);
  font-weight: 600;
}
.definition { color: var(--ink-muted); max-width: 360px; }
.pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}
.tag {
  display: inline-block;
  padding: 1px 6px;
  margin: 0 3px 3px 0;
  border-radius: 4px;
  font-size: 0.68rem;
  border: 1px solid var(--line-strong);
  color: var(--ink-muted);
}
.badge-common {
  font-size: 0.68rem;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 1px 6px;
}
.badge-root-word {
  font-size: 0.68rem;
  color: #7A5CA6;
  border: 1px solid #7A5CA6;
  border-radius: 4px;
  padding: 1px 6px;
}
.badge-derivable-noun {
  font-size: 0.68rem;
  color: #B08900;
  border: 1px solid #B08900;
  border-radius: 4px;
  padding: 1px 6px;
}
.sense-id {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  color: var(--ink-faint);
  white-space: nowrap;
}
.link-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.87rem;
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
}
.link-btn:hover { text-decoration: underline; }
.rel-count { font-variant-numeric: tabular-nums; }
.confidence { font-variant-numeric: tabular-nums; color: var(--ink-muted); }
.empty-state {
  padding: 40px 16px;
  text-align: center;
  color: var(--ink-muted);
  font-size: 0.9rem;
}
.unresolved-panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 3px solid #C2544B;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
  margin-bottom: 16px;
}
.unresolved-panel .word-form {
  display: inline-block;
  margin: 0 6px 6px 0;
  padding: 2px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, #C2544B 12%, transparent);
  font-size: 0.82rem;
}
.words-layout, .stack-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
tbody tr[data-word-id] { cursor: pointer; }
tbody tr[data-word-id].selected { background: color-mix(in srgb, var(--accent) 14%, transparent); }
.detail-panel {
  position: sticky;
  top: 16px;
  z-index: 2;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px;
  max-height: min(52vh, 520px);
  overflow-y: auto;
}
.detail-empty {
  color: var(--ink-muted);
  font-size: 0.85rem;
  text-align: center;
  padding: 28px 8px;
}
.detail-word {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.15rem;
}
.detail-entry-id {
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--ink-muted);
  user-select: all;
}
.detail-entry-id code {
  font-family: inherit;
}
.detail-definition {
  color: var(--ink-muted);
  font-size: 0.85rem;
  margin-top: 8px;
  line-height: 1.4;
}
.detail-section-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-muted);
  margin: 16px 0 6px;
}
summary.detail-section-title {
  cursor: pointer;
  user-select: none;
  margin: 16px 0 4px;
}
summary.detail-section-title::marker { color: var(--ink-muted); }
.rel-entry {
  padding: 7px 0;
  border-bottom: 1px solid var(--line);
}
.rel-entry:last-child { border-bottom: none; }
.rel-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.83rem;
}
.rel-row .rel-dir { color: var(--ink-muted); font-size: 0.8rem; width: 12px; text-align: center; flex: none; }
.rel-row .link-btn { margin-left: auto; text-align: right; }
.rel-sentence {
  margin: 4px 0 0 20px;
  color: var(--ink-muted);
  font-size: 0.8rem;
  line-height: 1.4;
}
.pad-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  margin: 6px 0;
}
.pad-row .pad-label {
  width: 118px;
  flex: none;
  color: var(--ink-muted);
}
.pad-row .pad-value {
  width: 42px;
  flex: none;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.pad-track {
  position: relative;
  flex: 1;
  height: 8px;
  background: var(--line);
  border-radius: 4px;
  overflow: hidden;
}
.pad-track::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--ink-muted);
  opacity: 0.5;
}
.pad-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--accent);
}
.pad-fill.negative { background: #C2544B; }
.word-form-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.83rem;
  margin: 4px 0;
}
.word-form-row .word-form-label {
  width: 190px;
  flex: none;
  color: var(--ink-muted);
}
.word-form-row .word-form-value {
  font-family: var(--font-mono);
}
.sense-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sense-row {
  padding: 7px 0;
  border-bottom: 1px solid var(--line);
  font-size: 0.83rem;
}
.sense-row:last-child { border-bottom: none; }
.sense-row.primary { font-weight: 600; }
.sense-number {
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
  margin-right: 6px;
}
.sense-primary-tag {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--accent);
  font-weight: 700;
  margin-left: 2px;
}
.sense-definition { font-weight: 400; }
.sense-meta {
  display: block;
  margin-top: 2px;
  font-size: 0.78rem;
  color: var(--ink-muted);
}
.sense-synonyms { margin-left: 6px; }
.sense-frequency {
  margin-left: 6px;
  font-variant-numeric: tabular-nums;
}
.sense-frequency::before { content: "\\2022  "; }
.sense-rels {
  margin-top: 4px;
}
.sense-rels summary {
  cursor: pointer;
  user-select: none;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-muted);
}
.sense-rels summary::marker { color: var(--ink-muted); }
.sense-rels .detail-relationships-section,
.sense-rels .detail-empty {
  margin-top: 4px;
}
.def-text { line-height: 1.7; }
.def-word {
  position: relative;
  border-bottom: 1px dotted var(--ink-muted);
  cursor: help;
}
.def-word.def-word-unresolved {
  border-bottom-style: dashed;
  border-bottom-color: #C2544B;
}
.def-word .def-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 7px);
  transform: translate(-50%, 4px);
  width: max-content;
  max-width: 220px;
  background: var(--ink);
  color: var(--ground);
  font-size: 0.74rem;
  line-height: 1.4;
  padding: 8px 10px;
  border-radius: 5px;
  box-shadow: var(--shadow);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease, transform 0.12s ease;
  z-index: 5;
}
.def-word .def-tooltip .tt-title {
  display: block;
  font-family: var(--font-mono);
  font-weight: 700;
  margin-bottom: 2px;
}
.def-word .def-tooltip .tt-meta {
  display: block;
  opacity: 0.75;
  margin-bottom: 4px;
}
.def-word:hover .def-tooltip, .def-word:focus .def-tooltip, .def-word:focus-visible .def-tooltip {
  opacity: 1;
  transform: translate(-50%, 0);
}
.hierarchy-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.hierarchy-toolbar label {
  font-size: 0.8rem;
  color: var(--ink-muted);
}
select#hierarchy-kind {
  padding: 9px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.88rem;
}
.hierarchy-note {
  font-size: 0.8rem;
  color: var(--ink-muted);
  margin-bottom: 12px;
  line-height: 1.4;
}
.hierarchy-svg-wrap {
  overflow-x: auto;
}
svg.hierarchy-graph { display: block; }
.hierarchy-edge {
  stroke: var(--line-strong);
  stroke-width: 1.4;
  fill: none;
}
.hierarchy-arrow { fill: var(--line-strong); }
.hierarchy-node-svg { cursor: pointer; }
.hierarchy-node-svg circle { stroke: var(--surface); stroke-width: 2; }
.hierarchy-node-svg text {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--ink);
}
.hierarchy-node-svg:hover text, .hierarchy-node-svg:focus text { fill: var(--accent); text-decoration: underline; }
.hierarchy-node-svg:hover circle, .hierarchy-node-svg:focus circle { stroke: var(--accent); }
.hierarchy-node-selected text { fill: var(--accent); font-weight: 700; }
.hierarchy-node-selected circle { stroke: var(--accent); stroke-width: 3; }
.hierarchy-node-cross-ref circle { stroke-dasharray: 2 2; opacity: .65; }
.hierarchy-node-cross-ref text { opacity: .65; font-style: italic; }
.hierarchy-node-cross-ref .hierarchy-box { stroke-dasharray: 3 3; opacity: .65; }
.hierarchy-box {
  fill: var(--ground);
  stroke: var(--line-strong);
  stroke-width: 1.2;
}
.hierarchy-cross-ref {
  font-size: 0.78rem;
  color: var(--ink-muted);
  font-style: italic;
}
.hierarchy-clusters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hierarchy-cluster {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 10px 12px;
}
.hierarchy-cluster-title {
  font-size: 0.72rem;
  color: var(--ink-muted);
  margin-bottom: 6px;
}
.hierarchy-cluster-words {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
}
.hierarchy-cluster-chip { white-space: nowrap; }
.cyclic-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.cyclic-toolbar label {
  font-size: 0.8rem;
  color: var(--ink-muted);
}
select#cyclic-kind {
  padding: 9px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.88rem;
}
.cyclic-note {
  font-size: 0.8rem;
  color: var(--ink-muted);
  margin-bottom: 12px;
  line-height: 1.4;
}
.cyclic-clusters {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.cyclic-cluster {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px;
}
.cyclic-cluster-title {
  font-size: 0.78rem;
  color: var(--ink-muted);
  margin-bottom: 8px;
}
.cyclic-svg-wrap {
  overflow-x: auto;
}
svg.cyclic-graph { display: block; }
.cyclic-edge {
  stroke: var(--line-strong);
  stroke-width: 1.4;
}
.cyclic-arrow { fill: var(--line-strong); }
.cyclic-box {
  fill: var(--ground);
  stroke: var(--line-strong);
  stroke-width: 1.2;
}
.cyclic-node { cursor: pointer; }
.cyclic-node circle { stroke: var(--surface); stroke-width: 2; }
.cyclic-node text {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--ink);
}
.cyclic-node:hover text, .cyclic-node:focus text { fill: var(--accent); text-decoration: underline; }
.cyclic-node:hover circle, .cyclic-node:focus circle { stroke: var(--accent); }
.cyclic-node-selected text { fill: var(--accent); font-weight: 700; }
.cyclic-node-selected circle { stroke: var(--accent); stroke-width: 3; }
@media (max-width: 860px) {
  .detail-panel { position: static; max-height: none; }
}
footer {
  margin-top: 28px;
  font-size: 0.76rem;
  color: var(--ink-muted);
  text-align: center;
}
/*@@STYLE_FRAGMENT_END@@*/
</style>
</head>
<body>
<div class="page">
  <header class="masthead">
    <h1>@@TITLE@@</h1>
    <div class="subtitle">@@WORD_COUNT@@ words &middot; @@RELATIONSHIP_COUNT@@ relationships &middot; compiled @@COMPILED_AT@@</div>
  </header>
  <!--@@BODY_FRAGMENT_START@@-->

  <div class="stat-row">
    <div class="stat"><div class="value" id="stat-words">@@WORD_COUNT@@</div><div class="label">Words</div></div>
    <div class="stat"><div class="value" id="stat-phrases">@@PHRASE_COUNT@@</div><div class="label">Phrases</div></div>
    <div class="stat"><div class="value" id="stat-senses">@@SENSE_COUNT@@</div><div class="label">Senses</div></div>
    <div class="stat"><div class="value" id="stat-rels">@@RELATIONSHIP_COUNT@@</div><div class="label">Relationships</div></div>
    <div class="stat"><div class="value">@@COMMON_COUNT@@</div><div class="label">Common vocabulary</div></div>
    <div class="stat"><div class="value">@@DOMAIN_SPECIFIC_COUNT@@</div><div class="label">Domain-specific</div></div>
    <div class="stat"><div class="value">@@POS_COUNT@@</div><div class="label">Parts of speech</div></div>
    <div class="stat"><div class="value">@@UNRESOLVED_COUNT@@</div><div class="label">Unresolved</div></div>
  </div>

  <div class="toolbar">
    <div class="search-field"><input id="search-word" type="text" placeholder="Search word&hellip;" aria-label="Search word" autocomplete="off"></div>
    <div class="search-field"><input id="search-gloss" type="text" placeholder="Search gloss&hellip;" aria-label="Search gloss" autocomplete="off"></div>
    <div class="search-field"><input id="search-definition" type="text" placeholder="Search definition&hellip;" aria-label="Search definition" autocomplete="off"></div>
    <select id="pos-filter"><option value="">All parts of speech</option></select>
    <select id="domain-filter"><option value="">All domains</option></select>
    <label class="root-word-toggle-label"><input type="checkbox" id="root-word-filter"> Root words only</label>
    <div class="tabs" role="tablist">
      <button id="tab-words" role="tab" aria-selected="true">Words</button>
      <button id="tab-phrases" role="tab" aria-selected="false">Phrases</button>
      <button id="tab-senses" role="tab" aria-selected="false">Senses</button>
      <button id="tab-rels" role="tab" aria-selected="false">Relationships</button>
      <button id="tab-hierarchy" role="tab" aria-selected="false">Hierarchy</button>
      <button id="tab-cyclic" role="tab" aria-selected="false">Cyclic</button>
    </div>
  </div>

  <section class="unresolved-panel" id="unresolved-panel" style="display:none">
    <div class="detail-section-title" style="margin-top:0">Unresolved &mdash; no seeded sense, no successful hydration</div>
    <div id="unresolved-list"></div>
  </section>

  <section class="panel active" id="panel-words">
    <div class="words-layout">
      <aside class="detail-panel">
        <div class="detail-empty" id="detail-empty-words">Select a word below to see its relationships.</div>
        <div id="detail-content-words" style="display:none"></div>
      </aside>
      <div class="table-wrap">
        <div class="cyclic-note" id="words-note" style="display:none"></div>
        <table>
          <thead>
            <tr>
              <th data-sort="lexical_form">Word</th>
              <th data-sort="pos">Part of speech</th>
              <th data-sort="domain">Domain</th>
              <th data-sort="definition">Definition</th>
              <th>Labels</th>
              <th data-sort="relationship_count" style="text-align:right">Relationships</th>
            </tr>
          </thead>
          <tbody id="words-body"></tbody>
        </table>
        <div class="empty-state" id="words-empty" style="display:none">@@WORDS_EMPTY_MESSAGE@@</div>
      </div>
    </div>
  </section>

  <section class="panel" id="panel-phrases">
    <div class="words-layout">
      <aside class="detail-panel">
        <div class="detail-empty" id="detail-empty-phrases">Select a phrase below to see its relationships.</div>
        <div id="detail-content-phrases" style="display:none"></div>
      </aside>
      <div class="table-wrap">
        <div class="cyclic-note" id="phrases-note" style="display:none"></div>
        <table>
          <thead>
            <tr>
              <th data-sort="lexical_form">Phrase</th>
              <th data-sort="pos">Part of speech</th>
              <th data-sort="phrase_type">Phrase type</th>
              <th data-sort="definition">Definition</th>
              <th>Labels</th>
            </tr>
          </thead>
          <tbody id="phrases-body"></tbody>
        </table>
        <div class="empty-state" id="phrases-empty" style="display:none">@@PHRASES_EMPTY_MESSAGE@@</div>
      </div>
    </div>
  </section>

  <section class="panel" id="panel-senses">
    <div class="words-layout">
      <aside class="detail-panel">
        <div class="detail-empty" id="detail-empty-senses">Select a sense below to see its relationships.</div>
        <div id="detail-content-senses" style="display:none"></div>
      </aside>
      <div class="table-wrap">
        <div class="cyclic-note" id="senses-note" style="display:none"></div>
        <table>
          <thead>
            <tr>
              <th data-sort="lexical_form">Members</th>
              <th data-sort="pos">Part of speech</th>
              <th data-sort="domain">Domain</th>
              <th data-sort="definition">Definition</th>
              <th data-sort="sense_frequency" style="text-align:right">Frequency</th>
              <th>Labels</th>
            </tr>
          </thead>
          <tbody id="senses-body"></tbody>
        </table>
        <div class="empty-state" id="senses-empty" style="display:none">@@SENSES_EMPTY_MESSAGE@@</div>
      </div>
    </div>
  </section>

  <section class="panel" id="panel-rels">
    <div class="table-wrap">
      <div class="cyclic-note" id="rels-note" style="display:none"></div>
      <table>
        <thead>
          <tr>
            <th data-sort="source_text">Source</th>
            <th data-sort="kind">Relationship</th>
            <th data-sort="target_text">Target</th>
            <th data-sort="confidence" style="text-align:right">Confidence</th>
          </tr>
        </thead>
        <tbody id="rels-body"></tbody>
      </table>
      <div class="empty-state" id="rels-empty" style="display:none">@@RELS_EMPTY_MESSAGE@@</div>
    </div>
  </section>

  <section class="panel" id="panel-hierarchy">
    <div class="stack-layout">
      <aside class="detail-panel">
        <div class="detail-empty" id="detail-empty-hierarchy">Select a word in the tree below to see its relationships.</div>
        <div id="detail-content-hierarchy" style="display:none"></div>
      </aside>
      <div class="detail-panel" style="max-height:none">
        <div class="hierarchy-toolbar">
          <label for="hierarchy-kind">Relationship kind</label>
          <select id="hierarchy-kind"></select>
        </div>
        <div class="hierarchy-note" id="hierarchy-note"></div>
        <div id="hierarchy-tree"></div>
      </div>
    </div>
  </section>

  <section class="panel" id="panel-cyclic">
    <div class="stack-layout">
      <aside class="detail-panel">
        <div class="detail-empty" id="detail-empty-cyclic">Select a word in a cluster below to see its relationships.</div>
        <div id="detail-content-cyclic" style="display:none"></div>
      </aside>
      <div class="detail-panel" style="max-height:none">
        <div class="cyclic-toolbar">
          <label for="cyclic-kind">Relationship kind</label>
          <select id="cyclic-kind"></select>
        </div>
        <div class="cyclic-note" id="cyclic-note"></div>
        <div class="cyclic-clusters" id="cyclic-clusters"></div>
      </div>
    </div>
  </section>

  <!--@@BODY_FRAGMENT_END@@-->
  <footer>Generated by DictionaryView (lira.vocabulary.ui)</footer>
</div>

<script>
/*@@SCRIPT_FRAGMENT_START@@*/
const WORDS = @@WORDS_JSON@@;
const PHRASES = @@PHRASES_JSON@@;
const SENSES = @@SENSES_JSON@@;
const RELS = @@RELS_JSON@@;
const UNRESOLVED = @@UNRESOLVED_JSON@@;
const POS_COLORS = @@POS_COLORS_JSON@@;
const GROUP_COLORS = @@GROUP_COLORS_JSON@@;
const GROUP_NAMES = @@GROUP_NAMES_JSON@@;
const DOMAIN_COLORS = @@DOMAIN_COLORS_JSON@@;
// True when this Domain's own Word/relationship count is over
// DictionaryView's own MAX_INTERACTIVE_WORDS (that constant's own
// docstring) -- WORDS/RELS above are deliberately [] in that case, not
// a truncated slice of the real data, so the stat tiles below fall back
// to the true, still-accurate TOTAL_WORD_COUNT/TOTAL_RELATIONSHIP_COUNT
// instead of the empty arrays' own (misleadingly zero) length.
const OVER_CAPACITY = @@OVER_CAPACITY_JSON@@;
// Same reasoning as OVER_CAPACITY just above, checked against the
// Phrases's own count instead -- PHRASES is deliberately [] whenever
// this is true (render()'s own overCapacityPhrases), not a truncated
// slice, so the Phrases stat tile falls back to TOTAL_PHRASE_COUNT the
// same way the Words tile already falls back to TOTAL_WORD_COUNT.
const OVER_CAPACITY_PHRASES = @@OVER_CAPACITY_PHRASES_JSON@@;
// Same reasoning as OVER_CAPACITY_PHRASES just above, checked against
// the Senses store's own count instead.
const OVER_CAPACITY_SENSES = @@OVER_CAPACITY_SENSES_JSON@@;
const TOTAL_WORD_COUNT = @@WORD_COUNT@@;
const TOTAL_PHRASE_COUNT = @@PHRASE_COUNT@@;
const TOTAL_SENSE_COUNT = @@SENSE_COUNT@@;
const TOTAL_RELATIONSHIP_COUNT = @@RELATIONSHIP_COUNT@@;
// The pos-filter/domain-filter <select> options -- computed server-side
// off every Word in the Dictionary (render()'s own posValues/
// domainValues), not derived from WORDS here: WORDS is [] whenever
// OVER_CAPACITY is true, which used to leave both filters silently
// empty despite the Dictionary actually holding hundreds of thousands
// of Words (populatePosFilter/populateDomainFilter's own docstrings).
const POS_VALUES = @@POS_VALUES_JSON@@;
const DOMAIN_VALUES = @@DOMAIN_VALUES_JSON@@;
// The Hierarchy/Cyclic tabs' own "Relationship kind" dropdowns -- same
// reasoning as POS_VALUES/DOMAIN_VALUES just above, computed server-side
// off the whole LexicalRelationshipStore (render()'s own
// relationshipKindCounts()) rather than scanned from RELS, which is []
// whenever OVER_CAPACITY is true. One \`{kind, group, count}\` entry per
// kind actually present in this Dictionary.
const RELATIONSHIP_KIND_COUNTS = @@RELATIONSHIP_KIND_COUNTS_JSON@@;

// selectedWordId is shared across every tab -- Words (row highlight +
// detail panel), Relationships (scopes the table to just this word),
// Hierarchy (the tree's own "centre word"), and Cyclic (highlights its
// own cluster) all read the *same* value, rather than each tab tracking
// its own independent selection the way an earlier version of this
// script did. selectWord() below is the one place that ever writes it.
const state = {
  tab: "words", search: { word: "", gloss: "", definition: "" }, pos: "", domain: "", rootWordsOnly: false,
  selectedWordId: null,
  hierarchyKind: null, cyclicKind: null,
  sort: { words: ["lexical_form", 1], rels: ["source_text", 1] },
};

function titleCase(s) {
  return s.toLowerCase().split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// Reciprocal-kind groupings for the Hierarchy/Cyclic kind selectors --
// shown together under one <optgroup> rather than scattered across a
// flat alphabetical list, so a reciprocal pair (or, for TROPONYM, the
// verb-specific hyponymy triple sharing HYPERNYM) reads as one unit.
// HYPERNYM/HYPONYM/TROPONYM applies to nouns (HYPERNYM/HYPONYM) and
// verbs (TROPONYM/HYPERNYM, troponymy being verb-specific hyponymy --
// examples/troponym_verb_backfill.py's own module docstring);
// MERONYM/HOLONYM applies to nouns. A kind not listed here (SYNONYM,
// ANTONYM, RELATED, CAUSE, ENTAILMENT, every morphological/orthographic
// kind) has no distinct reciprocal-kind partner of its own -- either
// genuinely symmetric (stored both directions under the same kind),
// paired with LEMMA_FORM generically, or -- CAUSE and ENTAILMENT
// specifically -- simply not a reciprocal pair at all: both apply to
// verbs and often co-occur on the identical WordNet pointer pair
// (\`>\` alongside \`*\`), but they name two distinct relations
// (causation, logical entailment), not two directions of one relation
// the way
// HYPERNYM/HYPONYM or MERONYM/HOLONYM are -- grouping them here would
// misleadingly imply CAUSE is "the opposite of" ENTAILMENT, which it
// isn't; each stays in the plain ungrouped list instead.
const KIND_PAIR_GROUPS = [
  { label: "Hypernym / Hyponym / Troponym", kinds: ["HYPERNYM", "HYPONYM", "TROPONYM"] },
  { label: "Meronym / Holonym", kinds: ["MERONYM", "HOLONYM"] },
];

// Builds <option>s for every kind in \`counts\`, grouping any kind listed
// in KIND_PAIR_GROUPS under its own <optgroup> (kinds sorted within the
// group in the order declared, not alphabetically, so e.g. Hypernym
// reads before Hyponym) and appending every remaining kind afterward,
// alphabetically, exactly as before this grouping existed.
function appendKindOptions(select, counts) {
  const remaining = new Set(Object.keys(counts));
  KIND_PAIR_GROUPS.forEach(({ label, kinds }) => {
    const present = kinds.filter(k => remaining.has(k));
    if (present.length < 2) return; // nothing to pair here in this Dictionary
    const group = document.createElement("optgroup");
    group.label = label;
    present.forEach(kind => {
      const opt = document.createElement("option");
      opt.value = kind;
      opt.textContent = \`\${titleCase(kind)} (\${counts[kind]})\`;
      group.appendChild(opt);
      remaining.delete(kind);
    });
    select.appendChild(group);
  });
  [...remaining].sort().forEach(kind => {
    const opt = document.createElement("option");
    opt.value = kind;
    opt.textContent = \`\${titleCase(kind)} (\${counts[kind]})\`;
    select.appendChild(opt);
  });
}

function posPill(pos) {
  const color = POS_COLORS[pos] || "#7A7A7A";
  return \`<span class="pill" style="background:\${color}">\${titleCase(pos)}</span>\`;
}

// word.phrase_type's own pill -- only ever set on a record resolved
// from a Phrase (WordRecord.phrase_type's own docstring), so this is
// only ever called from wordDetailHTML() alongside posPill()/domainPill(),
// never for an ordinary Word. Its own fixed colour, distinct from both
// POS_COLORS and DOMAIN_COLORS, since phraseType is neither -- it's a
// third, independent classification (grammatical internal structure,
// PhraseType's own docstring, vocabulary/data/enums/phrase_type.ts) that can
// appear alongside a Phrase's own partOfSpeech pill in the same row.
function phraseTypePill(phraseType) {
  return \`<span class="pill" style="background:#6E5A9E">\${titleCase(phraseType)}</span>\`;
}

// The Princeton WordNet 3.1 synset a Word/related-word came from
// (WordRecord.sense_id / RelationshipRecord.*_sense_id), rendered as a
// small muted tag to the right of its own word text -- "" (nothing
// shown) for a Word with no sense_id, i.e. every Common Vocabulary
// Cache entry that didn't come from WordSeeder.seedWordNet.
function senseIdBadge(senseId) {
  return senseId ? \`<span class="sense-id" title="Princeton WordNet 3.1 synset">\${senseId}</span>\` : "";
}

function relPill(kind, group) {
  const color = GROUP_COLORS[group] !== undefined ? GROUP_COLORS[group] : "#7A7A7A";
  return \`<span class="pill" style="background:\${color}" title="\${GROUP_NAMES[group] || ''}">\${titleCase(kind)}</span>\`;
}

// word_seeder.ts's own relationshipKindForPointer stores only ONE edge
// per hypernym/meronym-family fact (a word's own outgoing kind), never
// a second, separately-labelled edge for the reciprocal direction --
// but a word's own relationship list still needs to read as "Hyponym"/
// "Holonym" when it's on the *receiving* end of one of these, not
// "Hypernym"/"Meronym" again with only the arrow reversed (that would
// misread as "the other word is my hypernym", not "I have the other
// word as a hyponym"). This is a display-only relabelling -- the
// underlying relationshipSentence() call still uses the real stored
// kind, which already reads correctly regardless of viewing direction
// (relationshipsSectionHTML's own call site), and the pill's own colour
// (relPill's \`group\` argument) is unaffected either way: every kind
// listed here shares its own reciprocal's exact group/category
// (LexicalRelationshipType's own bit-packing, lexical_relationship_type.ts).
const RECIPROCAL_DISPLAY_KIND = {
  HYPERNYM: "HYPONYM",
  MERONYM: "HOLONYM",
};

function displayKind(kind, outgoing) {
  return outgoing ? kind : (RECIPROCAL_DISPLAY_KIND[kind] || kind);
}

function domainPill(domain) {
  if (!domain) return "";
  // A polysemous Common word's domain reads as "<hypernym>.common"
  // (Word.domain_tag) rather than plain "Common" -- still a Common
  // word, so it keeps Common's own colour rather than falling through
  // to the generic "unknown domain" grey.
  const color = DOMAIN_COLORS[domain] || (domain.endsWith(".common") ? DOMAIN_COLORS["Common"] : "#7A7A7A");
  return \`<span class="pill" style="background:\${color}">\${domain}</span>\`;
}

// One plain-English sentence per relationship kind, always phrased in
// terms of the edge's own (source, target) -- e.g. a HYPERNYM edge is
// stored as (narrower, HYPERNYM, broader), so "source is a type of
// target" reads correctly regardless of which side the viewer selected
// (relationshipsForWord's otherText/outgoing only control the arrow and
// which word is clickable, not this sentence). Kinds not listed fall
// back to a generic "source is target-kind-related to target".
const RELATIONSHIP_SENTENCES = {
  // Lexical Semantic
  SYNONYM: (s, t) => \`\${s} means the same as \${t}.\`,
  ANTONYM: (s, t) => \`\${s} is the opposite of \${t}.\`,
  HYPERNYM: (s, t) => \`\${s} is a type of \${t}.\`,
  HYPONYM: (s, t) => \`\${t} is a type of \${s}.\`,
  // WordNet distinguishes what kind of part-whole fact this is (a piece
  // of a larger whole, a member of a group, or a substance a whole is
  // made of) via a \`meronymKind\` qualifier on the same MERONYM kind,
  // not three separate relationship kinds (MERONYM's own docstring,
  // lexical_relationship_type.ts) -- \`q\` reads that qualifier straight
  // from the row (relationshipRecordFor()'s own qualifier field,
  // dictionary_view.ts), defaulting to the general "part of" phrasing
  // for an unqualified, hand-curated Common Vocabulary Cache fact.
  MERONYM: (s, t, q) => (q === "member" ? \`\${s} is a member of \${t}.\` : q === "substance" ? \`\${s} is made of \${t}.\` : \`\${s} is a part of \${t}.\`),
  HOLONYM: (s, t, q) => (q === "member" ? \`\${t} is a member of \${s}.\` : q === "substance" ? \`\${t} is made of \${s}.\` : \`\${t} is a part of \${s}.\`),
  TROPONYM: (s, t) => \`\${t} is a specific manner of \${s}.\`,
  ENTAILMENT: (s, t) => \`\${s} entails \${t}.\`,
  CAUSE: (s, t) => \`\${s} causes \${t}.\`,
  RELATED: (s, t) => \`\${s} is related to \${t}.\`,
  // Lexical Semantic -- WordNet-sourced (lexical_relationship_type.ts's
  // own docstring on PERTAINYM through USAGE_DOMAIN)
  SIMILAR_TO: (s, t) => \`\${s} is similar in meaning to \${t}.\`,
  ALSO_SEE: (s, t) => \`\${s} is related to \${t} -- see also.\`,
  VERB_GROUP: (s, t) => \`\${s} and \${t} are closely related senses.\`,
  ATTRIBUTE: (s, t) => \`\${s} is a value of the attribute \${t}.\`,
  TOPIC_DOMAIN: (s, t) => \`\${s} belongs to the \${t} topic domain.\`,
  REGION_DOMAIN: (s, t) => \`\${s} belongs to the \${t} regional domain.\`,
  USAGE_DOMAIN: (s, t) => \`\${s} belongs to the \${t} usage domain.\`,
  // Morphological -- base relation
  LEMMA_FORM: (s, t) => \`\${t} is the base (lemma) form of \${s}.\`,
  INFLECTION: (s, t) => \`\${t} is an inflected form of \${s}.\`,
  // Morphological -- number
  SINGULAR_FORM: (s, t) => \`\${t} is the singular form of \${s}.\`,
  PLURAL_FORM: (s, t) => \`\${t} is the plural form of \${s}.\`,
  // Morphological -- tense
  PRESENT_TENSE_FORM: (s, t) => \`\${t} is the present-tense form of \${s}.\`,
  PAST_TENSE_FORM: (s, t) => \`\${t} is the past-tense form of \${s}.\`,
  // Morphological -- aspect
  PRESENT_PARTICIPLE_FORM: (s, t) => \`\${t} is the present-participle form of \${s}.\`,
  PAST_PARTICIPLE_FORM: (s, t) => \`\${t} is the past-participle form of \${s}.\`,
  // Morphological -- person
  FIRST_PERSON_FORM: (s, t) => \`\${t} is the first-person form of \${s}.\`,
  SECOND_PERSON_FORM: (s, t) => \`\${t} is the second-person form of \${s}.\`,
  THIRD_PERSON_FORM: (s, t) => \`\${t} is the third-person form of \${s}.\`,
  // Morphological -- degree
  COMPARATIVE_FORM: (s, t) => \`\${t} is the comparative form of \${s}.\`,
  SUPERLATIVE_FORM: (s, t) => \`\${t} is the superlative form of \${s}.\`,
  // Morphological -- derivation
  DERIVED_FORM: (s, t) => \`\${t} is derived from \${s}.\`,
  AGENT_NOUN_DERIVATION: (s, t) => \`\${t} is the agent-noun form of \${s}.\`,
  NOMINALISATION: (s, t) => \`\${t} is the noun form of \${s}.\`,
  ADJECTIVAL_DERIVATION: (s, t) => \`\${t} is the adjective form of \${s}.\`,
  ADVERBIAL_DERIVATION: (s, t) => \`\${t} is the adverb form of \${s}.\`,
  PERTAINYM: (s, t) => \`\${s} pertains to \${t}.\`,
  // Morphological -- pronoun form
  PRONOUN_OBJECT_FORM: (s, t) => \`\${t} is the object form of \${s}.\`,
  PRONOUN_SUBJECT_FORM: (s, t) => \`\${t} is the subject form of \${s}.\`,
  PRONOUN_POSSESSIVE_DETERMINER_FORM: (s, t) => \`\${t} is the possessive-determiner form of \${s}.\`,
  PRONOUN_POSSESSIVE_FORM: (s, t) => \`\${t} is the possessive form of \${s}.\`,
  PRONOUN_REFLEXIVE_FORM: (s, t) => \`\${t} is the reflexive form of \${s}.\`,
  PRONOUN_RECIPROCAL_FORM: (s, t) => \`\${t} is the reciprocal form of \${s}.\`,
  // Orthographic and Naming
  SPELLING_VARIANT: (s, t) => \`\${t} is a spelling variant of \${s}.\`,
  HISTORICAL_SPELLING: (s, t) => \`\${t} is a historical spelling of \${s}.\`,
  ABBREVIATION: (s, t) => \`\${t} is an abbreviation of \${s}.\`,
  ACRONYM: (s, t) => \`\${t} is an acronym formed from \${s}.\`,
  INITIALISM: (s, t) => \`\${t} is an initialism formed from \${s}.\`,
  CONTRACTION: (s, t) => \`\${t} is a contracted form of \${s}.\`,
  TRANSLITERATION: (s, t) => \`\${t} is a transliteration of \${s}.\`,
  CAPITALISATION: (s, t) => \`\${t} is a capitalisation variant of \${s}.\`,
  DIACRITIC_VARIANT: (s, t) => \`\${t} is a diacritic variant of \${s}.\`,
};

function relationshipSentence(kind, sourceText, targetText, qualifier) {
  const template = RELATIONSHIP_SENTENCES[kind];
  if (template) return template(sourceText, targetText, qualifier);
  return \`\${sourceText} is \${titleCase(kind).toLowerCase()}-related to \${targetText}.\`;
}

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

// Renders word.definition_segments (DictionaryView._definition_segments)
// as inline text with each word token wrapped in a hover/focus tooltip
// identifying its own part of speech, domain, and a short gloss -- built
// from Word.definition_words() (vocabulary/documentation/README.md, 4.4)
// on the Python side, not re-derived here. Plain-text segments
// (punctuation, whitespace) pass through unwrapped, so the sentence
// reads exactly as word.definition itself does.
function definitionSegmentHTML(seg) {
  if (!seg.word) return seg.text;
  if (!seg.resolved) {
    return \`<span class="def-word def-word-unresolved" tabindex="0">\${seg.text}\`
      + \`<span class="def-tooltip"><span class="tt-title">\${seg.text}</span>\`
      + \`<span class="tt-meta">Not in this Dictionary</span></span></span>\`;
  }
  const meta = [titleCase(seg.pos)];
  if (seg.domain) meta.push(seg.domain);
  return \`<span class="def-word" tabindex="0" data-word-id="\${seg.word_id}">\${seg.text}\`
    + \`<span class="def-tooltip"><span class="tt-title">\${seg.lexical_form}</span>\`
    + \`<span class="tt-meta">\${meta.join(" &middot; ")}</span>\${truncate(seg.gloss, 110)}</span></span>\`;
}

function renderDefinition(word) {
  if (!word.definition_segments || !word.definition_segments.length) {
    return word.definition || word.gloss || "No definition on record.";
  }
  return \`<span class="def-text">\${word.definition_segments.map(definitionSegmentHTML).join("")}</span>\`;
}

function populatePosFilter() {
  const select = document.getElementById("pos-filter");
  POS_VALUES.forEach(pos => {
    const opt = document.createElement("option");
    opt.value = pos;
    opt.textContent = titleCase(pos);
    select.appendChild(opt);
  });
}

function populateDomainFilter() {
  const select = document.getElementById("domain-filter");
  DOMAIN_VALUES.forEach(domain => {
    const opt = document.createElement("option");
    opt.value = domain;
    opt.textContent = domain;
    select.appendChild(opt);
  });
}

function populateHierarchyKindFilter() {
  const select = document.getElementById("hierarchy-kind");
  const counts = {};
  RELATIONSHIP_KIND_COUNTS.forEach(({ kind, count }) => { counts[kind] = count; });
  const kinds = Object.keys(counts).sort();
  appendKindOptions(select, counts);
  state.hierarchyKind = kinds[0] || null;
  if (state.hierarchyKind) select.value = state.hierarchyKind;
}

// Relabels every existing <option> in #hierarchy-kind with a count
// scoped to the shared selection, instead of leaving them stuck at
// populateHierarchyKindFilter()'s own whole-Dictionary counts forever
// -- the set of kinds offered never changes (only appendKindOptions
// does that), just the "(N)" each one reports, so this only ever
// touches option.textContent rather than rebuilding the <select>
// (preserving its own open/scroll state). Falls back to the
// whole-Dictionary count for a kind while nothing is selected, and
// also while a selected word's own relationship list is still an
// in-flight over-capacity fetch (detailRelsCache.get() returns
// undefined until fetchDetailRelsIfNeeded()'s request resolves) --
// showing 0 for every kind in that brief window would read as "this
// word has no relationships" before the real answer has even arrived.
function refreshHierarchyKindCounts() {
  const select = document.getElementById("hierarchy-kind");
  if (!select) return;
  const totals = {};
  RELATIONSHIP_KIND_COUNTS.forEach(({ kind, count }) => { totals[kind] = count; });
  let scoped = null;
  if (state.selectedWordId) {
    const rows = OVER_CAPACITY ? detailRelsCache.get(state.selectedWordId) : relationshipsForWord(state.selectedWordId);
    if (rows) {
      scoped = {};
      rows.forEach(r => { scoped[r.kind] = (scoped[r.kind] || 0) + 1; });
    }
  }
  select.querySelectorAll("option").forEach(opt => {
    const kind = opt.value;
    if (!kind) return;
    const count = scoped ? (scoped[kind] || 0) : (totals[kind] || 0);
    opt.textContent = \`\${titleCase(kind)} (\${count})\`;
  });
}

// Three independent substring filters (AND'd together, each one a
// no-op while empty) rather than one combined "word, gloss, or
// definition" box -- a search for a gloss term no longer also surfaces
// unrelated words whose *definition* happens to share that substring,
// and vice versa.
function matchesQuery(word) {
  const { word: wordQuery, gloss: glossQuery, definition: definitionQuery } = state.search;
  if (wordQuery && !word.lexical_form.toLowerCase().includes(wordQuery.toLowerCase())) return false;
  if (glossQuery && !word.gloss.toLowerCase().includes(glossQuery.toLowerCase())) return false;
  if (definitionQuery && !word.definition.toLowerCase().includes(definitionQuery.toLowerCase())) return false;
  return true;
}

function filteredWords() {
  return WORDS.filter(w => matchesQuery(w) && (!state.pos || w.pos === state.pos) && (!state.domain || w.domain === state.domain) && (!state.rootWordsOnly || w.is_root_word));
}

// AND's two independent conditions: the shared selection (any word
// selected in any tab -- selectWord()'s own docstring on why every tab
// reads the same value) scopes the table down to just that word's own
// relationships, on top of whichever free-text query is still typed
// into the search box, exactly the way the Words tab's own pos/domain/
// rootWordsOnly filters already compose with its own text search.
function filteredRels() {
  return RELS.filter(r => {
    if (state.selectedWordId && r.source_id !== state.selectedWordId && r.target_id !== state.selectedWordId) return false;
    const q = state.search.word;
    if (!q) return true;
    const ql = q.toLowerCase();
    return r.source_text.toLowerCase().includes(ql) || r.target_text.toLowerCase().includes(ql) || r.kind.toLowerCase().includes(ql);
  });
}

function relationshipsForWord(wordId) {
  return RELS.filter(r => r.source_id === wordId || r.target_id === wordId)
    .map(r => {
      const outgoing = r.source_id === wordId;
      return {
        ...r, outgoing,
        otherId: outgoing ? r.target_id : r.source_id,
        otherText: outgoing ? r.target_text : r.source_text,
        otherDomain: outgoing ? r.target_domain : r.source_domain,
        otherSenseId: outgoing ? r.target_sense_id : r.source_sense_id,
        pillKind: displayKind(r.kind, outgoing),
      };
    })
    .sort((a, b) => (a.group - b.group) || a.kind.localeCompare(b.kind));
}

function sortRows(rows, key, dir) {
  return rows.slice().sort((a, b) => {
    const av = a[key], bv = b[key];
    if (typeof av === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

// A generous safety cap, not a curation choice -- same reasoning as
// MAX_CYCLIC_GROUPS_SHOWN above: a Domain seeded from WordNet can carry
// hundreds of thousands of Words, and laying out that many <tr>
// elements in one innerHTML assignment is what actually locks up the
// tab, not anything about the data itself. Narrow with search/filters
// to reach a word outside the first MAX_WORD_ROWS_SHOWN.
const MAX_WORD_ROWS_SHOWN = 1000;

function wordRowHtml(w) {
  return \`
    <tr data-word-id="\${w.id}" class="\${w.id === state.selectedWordId ? 'selected' : ''}">
      <td><span class="word-form">\${w.lexical_form}</span> \${senseIdBadge(w.sense_id)}\${w.is_common ? ' <span class="badge-common">common</span>' : ''}\${w.is_root_word ? ' <span class="badge-root-word">root word</span>' : ''}\${w.is_derivable_noun ? ' <span class="badge-derivable-noun">derivable noun</span>' : ''}</td>
      <td>\${posPill(w.pos)}</td>
      <td>\${domainPill(w.domain)}</td>
      <td class="definition">\${w.definition || w.gloss || '<span style="opacity:.5">&mdash;</span>'}</td>
      <td>\${w.register_codes.concat(w.editorial_labels).map(t => \`<span class="tag">\${titleCase(t)}</span>\`).join('')}</td>
      <td style="text-align:right" class="rel-count">\${w.relationship_count}</td>
    </tr>\`;
}

// requestId of the most recently *dispatched* over-capacity search --
// renderWordsOverCapacity's own lira-search-words-result listener
// compares against this so a slow earlier search's response can never
// clobber a faster later one's (the same stale-response guard
// PortalShell's own render()/loadView() apply to a Vocabulary fragment
// fetch, portal_shell.ts's own comment on renderToken).
let latestWordSearchRequestId = null;
let wordSearchDebounceTimer = null;

function renderWords() {
  if (OVER_CAPACITY) {
    renderWordsOverCapacity();
    return;
  }
  let rows = filteredWords();
  const [key, dir] = state.sort.words;
  rows = sortRows(rows, key, dir);
  const shown = rows.slice(0, MAX_WORD_ROWS_SHOWN);
  const body = document.getElementById("words-body");
  document.getElementById("words-empty").style.display = rows.length ? "none" : "block";
  const note = document.getElementById("words-note");
  if (rows.length > shown.length) {
    note.style.display = "block";
    note.textContent = \`Showing the first \${shown.length.toLocaleString()} of \${rows.length.toLocaleString()} matching words -- search or filter to narrow.\`;
  } else {
    note.style.display = "none";
  }
  body.innerHTML = shown.map(wordRowHtml).join('');
  document.getElementById("stat-words").textContent = rows.length;
}

// Phrases reuse the same free-text search fields (search-word/-gloss/
// -definition) and the shared pos-filter Words already has -- both are
// meaningful for a Phrase (Phrase's own docstring, data/phrase.ts, on
// why it's still a real part-of-speech-tagged lexical entry) -- but not
// domain-filter or the root-word toggle, neither of which a Phrase has
// a field for. Same MAX_INTERACTIVE_WORDS-style capacity split Words
// has now too (renderPhrases()'s own OVER_CAPACITY_PHRASES branch below)
// -- a WordNet-seeded Phrases is tens of thousands of entries, not
// the "always embedded" scale an earlier version of this comment
// assumed.
function matchesPhraseQuery(phrase) {
  const { word: wordQuery, gloss: glossQuery, definition: definitionQuery } = state.search;
  if (wordQuery && !phrase.lexical_form.toLowerCase().includes(wordQuery.toLowerCase())) return false;
  if (glossQuery && !phrase.gloss.toLowerCase().includes(glossQuery.toLowerCase())) return false;
  if (definitionQuery && !phrase.definition.toLowerCase().includes(definitionQuery.toLowerCase())) return false;
  return true;
}

function filteredPhrases() {
  return PHRASES.filter(p => matchesPhraseQuery(p) && (!state.pos || p.pos === state.pos));
}

// data-word-id, not data-phrase-id -- a Phrase's own uuid lives in the
// exact same shared selection every other tab reads/writes
// (state.selectedWordId, selectWord()'s own docstring), so a Phrase row
// picks up the identical CSS (tbody tr[data-word-id]{cursor:pointer},
// .selected highlight) and click-delegation shape the Words table
// already has, rather than needing its own parallel set of both.
function phraseRowHtml(p) {
  return \`
    <tr data-word-id="\${p.id}" class="\${p.id === state.selectedWordId ? 'selected' : ''}">
      <td><span class="word-form">\${p.lexical_form}</span>\${p.is_common ? ' <span class="badge-common">common</span>' : ''}</td>
      <td>\${posPill(p.pos)}</td>
      <td>\${p.phrase_type ? phraseTypePill(p.phrase_type) : '<span style="opacity:.5">&mdash;</span>'}</td>
      <td class="definition">\${p.definition || p.gloss || '<span style="opacity:.5">&mdash;</span>'}</td>
      <td>\${p.register_codes.concat(p.editorial_labels).map(t => \`<span class="tag">\${titleCase(t)}</span>\`).join('')}</td>
    </tr>\`;
}

// A generous safety cap, not a curation choice -- same reasoning as
// MAX_WORD_ROWS_SHOWN above: a WordNet-seeded Phrases can carry tens
// of thousands of Phrases, and laying out that many <tr> elements in
// one innerHTML assignment is what actually locks up the tab, not
// anything about the data itself. Narrow with search/filters to reach a
// phrase outside the first MAX_PHRASE_ROWS_SHOWN.
const MAX_PHRASE_ROWS_SHOWN = 1000;

function renderPhrases() {
  if (OVER_CAPACITY_PHRASES) {
    renderPhrasesOverCapacity();
    return;
  }
  const rows = filteredPhrases().slice().sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  const shown = rows.slice(0, MAX_PHRASE_ROWS_SHOWN);
  const body = document.getElementById("phrases-body");
  document.getElementById("phrases-empty").style.display = rows.length ? "none" : "block";
  const note = document.getElementById("phrases-note");
  if (rows.length > shown.length) {
    note.style.display = "block";
    note.textContent = \`Showing the first \${shown.length.toLocaleString()} of \${rows.length.toLocaleString()} matching phrases -- search or filter to narrow.\`;
  } else {
    note.style.display = "none";
  }
  body.innerHTML = shown.map(phraseRowHtml).join('');
  document.getElementById("stat-phrases").textContent = rows.length;
}

// requestId of the most recently *dispatched* over-capacity Phrases
// search -- latestWordSearchRequestId's own exact counterpart, same
// stale-response guard.
let latestPhraseSearchRequestId = null;
let phraseSearchDebounceTimer = null;

// renderWordsOverCapacity()'s own exact counterpart for the Phrases tab
// -- see that function's own docstring for why this dispatches a
// "lira-search-phrases" DOM event instead of filtering an already-
// embedded PHRASES array (there isn't one, past OVER_CAPACITY_PHRASES).
function renderPhrasesOverCapacity() {
  if (phraseSearchDebounceTimer !== null) clearTimeout(phraseSearchDebounceTimer);
  phraseSearchDebounceTimer = setTimeout(() => {
    const requestId = 'phrase-search-' + Math.random().toString(36).slice(2);
    latestPhraseSearchRequestId = requestId;
    document.getElementById("phrases-note").style.display = "none";
    document.getElementById("phrases-empty").style.display = "none";
    document.getElementById("phrases-body").innerHTML =
      '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--ink-muted,#5B6660)">Searching…</td></tr>';
    document.dispatchEvent(new CustomEvent("lira-search-phrases", {
      detail: {
        requestId,
        word: state.search.word,
        gloss: state.search.gloss,
        definition: state.search.definition,
        pos: state.pos,
        limit: MAX_PHRASE_ROWS_SHOWN,
      },
    }));
  }, WORD_SEARCH_DEBOUNCE_MS);
}

// "lira-search-words-result"'s own exact counterpart for Phrases --
// renders the row list only (this event's own phrases are plain
// PhraseRecords, phraseRowHtml()'s own leaner shape -- not enough to
// feed the detail panel, wordForDetailPanel()'s own docstring on why a
// Phrase's own detail-panel resolution always goes through the shared
// "lira-search-words"/wordId path instead, regardless of this event).
document.addEventListener("lira-search-phrases-result", (e) => {
  const { requestId, phrases, totalMatches } = e.detail;
  if (requestId !== latestPhraseSearchRequestId) return;

  const body = document.getElementById("phrases-body");
  const empty = document.getElementById("phrases-empty");
  const note = document.getElementById("phrases-note");
  if (phrases.length === 0) {
    body.innerHTML = "";
    empty.style.display = "block";
    note.style.display = "none";
  } else {
    empty.style.display = "none";
    body.innerHTML = phrases.map(phraseRowHtml).join('');
    if (totalMatches > phrases.length) {
      note.style.display = "block";
      note.textContent = \`Showing the first \${phrases.length.toLocaleString()} of \${totalMatches.toLocaleString()} matching phrases -- narrow your search to see the rest.\`;
    } else {
      note.style.display = "none";
    }
  }
  document.getElementById("stat-phrases").textContent = TOTAL_PHRASE_COUNT;
  renderDetailPanel("phrases");
});

// Senses reuse the same free-text search fields and pos-filter Phrases
// already does (matchesPhraseQuery()'s own docstring on why both are
// meaningful) -- \`word\` matches against \`lexical_form\`, itself every
// member's own lexical form joined together (SenseRecord's own
// docstring, dictionary_view.ts), not a spelling Sense has of its own.
function matchesSenseQuery(sense) {
  const { word: wordQuery, gloss: glossQuery, definition: definitionQuery } = state.search;
  if (wordQuery && !sense.lexical_form.toLowerCase().includes(wordQuery.toLowerCase())) return false;
  if (glossQuery && !sense.gloss.toLowerCase().includes(glossQuery.toLowerCase())) return false;
  if (definitionQuery && !sense.definition.toLowerCase().includes(definitionQuery.toLowerCase())) return false;
  return true;
}

function filteredSenses() {
  return SENSES.filter(s => matchesSenseQuery(s) && (!state.pos || s.pos === state.pos) && (!state.rootWordsOnly || s.is_root_word));
}

// data-word-id, not data-sense-id -- phraseRowHtml()'s own exact
// reasoning: a Sense's own uuid lives in the identical shared selection
// every other tab reads/writes (state.selectedWordId), resolved to its
// first-registered member's own full Word detail via the shared
// "lira-search-words"/wordId path (DictionaryView.searchWords()'s own
// Senses fallback), not a parallel selection/lookup mechanism of its
// own.
function senseRowHtml(s) {
  return \`
    <tr data-word-id="\${s.id}" class="\${s.id === state.selectedWordId ? 'selected' : ''}">
      <td><span class="word-form">\${s.lexical_form}</span>\${s.is_common ? ' <span class="badge-common">common</span>' : ''}</td>
      <td>\${s.pos ? posPill(s.pos) : ''}</td>
      <td>\${domainPill(s.domain)}</td>
      <td class="definition">\${s.definition || s.gloss || '<span style="opacity:.5">&mdash;</span>'}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums">\${s.sense_frequency === null ? '<span style="opacity:.5">&mdash;</span>' : s.sense_frequency.toLocaleString()}</td>
      <td>\${s.is_root_word ? '<span class="badge-root-word">root word</span>' : ''}</td>
    </tr>\`;
}

// MAX_PHRASE_ROWS_SHOWN's own exact counterpart, same reasoning -- a
// WordNet-seeded Senses store can carry over a hundred thousand
// entries.
const MAX_SENSE_ROWS_SHOWN = 1000;

function renderSenses() {
  if (OVER_CAPACITY_SENSES) {
    renderSensesOverCapacity();
    return;
  }
  const rows = filteredSenses().slice().sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  const shown = rows.slice(0, MAX_SENSE_ROWS_SHOWN);
  const body = document.getElementById("senses-body");
  document.getElementById("senses-empty").style.display = rows.length ? "none" : "block";
  const note = document.getElementById("senses-note");
  if (rows.length > shown.length) {
    note.style.display = "block";
    note.textContent = \`Showing the first \${shown.length.toLocaleString()} of \${rows.length.toLocaleString()} matching senses -- search or filter to narrow.\`;
  } else {
    note.style.display = "none";
  }
  body.innerHTML = shown.map(senseRowHtml).join('');
  document.getElementById("stat-senses").textContent = rows.length;
}

// requestId of the most recently *dispatched* over-capacity Senses
// search -- latestPhraseSearchRequestId's own exact counterpart, same
// stale-response guard.
let latestSenseSearchRequestId = null;
let senseSearchDebounceTimer = null;

// renderPhrasesOverCapacity()'s own exact counterpart for the Senses
// tab -- dispatches a "lira-search-senses" DOM event instead of
// filtering an already-embedded SENSES array (there isn't one, past
// OVER_CAPACITY_SENSES).
function renderSensesOverCapacity() {
  if (senseSearchDebounceTimer !== null) clearTimeout(senseSearchDebounceTimer);
  senseSearchDebounceTimer = setTimeout(() => {
    const requestId = 'sense-search-' + Math.random().toString(36).slice(2);
    latestSenseSearchRequestId = requestId;
    document.getElementById("senses-note").style.display = "none";
    document.getElementById("senses-empty").style.display = "none";
    document.getElementById("senses-body").innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--ink-muted,#5B6660)">Searching…</td></tr>';
    document.dispatchEvent(new CustomEvent("lira-search-senses", {
      detail: {
        requestId,
        word: state.search.word,
        gloss: state.search.gloss,
        definition: state.search.definition,
        pos: state.pos,
        limit: MAX_SENSE_ROWS_SHOWN,
      },
    }));
  }, WORD_SEARCH_DEBOUNCE_MS);
}

// "lira-search-phrases-result"'s own exact counterpart for Senses --
// renders the row list only; a selected Sense's own detail-panel data
// always resolves via the shared "lira-search-words"/wordId path
// instead (DictionaryView.searchWords()'s own Senses fallback), same
// reasoning as the Phrases listener just above.
document.addEventListener("lira-search-senses-result", (e) => {
  const { requestId, senses, totalMatches } = e.detail;
  if (requestId !== latestSenseSearchRequestId) return;

  const body = document.getElementById("senses-body");
  const empty = document.getElementById("senses-empty");
  const note = document.getElementById("senses-note");
  if (senses.length === 0) {
    body.innerHTML = "";
    empty.style.display = "block";
    note.style.display = "none";
  } else {
    empty.style.display = "none";
    body.innerHTML = senses.map(senseRowHtml).join('');
    if (totalMatches > senses.length) {
      note.style.display = "block";
      note.textContent = \`Showing the first \${senses.length.toLocaleString()} of \${totalMatches.toLocaleString()} matching senses -- narrow your search to see the rest.\`;
    } else {
      note.style.display = "none";
    }
  }
  document.getElementById("stat-senses").textContent = TOTAL_SENSE_COUNT;
  renderDetailPanel("senses");
});

// How long to wait after the last keystroke before actually dispatching
// an over-capacity search -- WORDS/RELS are both [] past
// MAX_INTERACTIVE_WORDS, so unlike the local-array paths above (instant,
// in-process filtering), every keystroke here is a round trip out to the
// Vocabulary Service worker (lira-search-words/lira-search-relationships
// below, shared by both renderWordsOverCapacity() and
// renderRelsOverCapacity()); debouncing keeps a fast typist from firing
// a search per character.
const WORD_SEARCH_DEBOUNCE_MS = 250;

// The over-capacity counterpart to renderWords()'s own local-array
// path: instead of filtering an already-embedded WORDS array (there
// isn't one -- MAX_INTERACTIVE_WORDS's own docstring), this dispatches
// a "lira-search-words" DOM event carrying the current search/filter
// state and waits for whatever's listening (PortalShell, when this
// fragment is embedded in the Portal -- portal_shell.ts's own listener)
// to resolve it against the real Dictionary and fire back
// "lira-search-words-result" with the same requestId. A standalone
// render()/downloadAsFile() page (no Portal, no worker to ask) has
// nothing listening for the event at all, so an over-capacity Domain
// there stays non-interactive beyond the stat tiles -- a real
// limitation of a page with no server behind it, not a bug.
function renderWordsOverCapacity() {
  if (wordSearchDebounceTimer !== null) clearTimeout(wordSearchDebounceTimer);
  wordSearchDebounceTimer = setTimeout(() => {
    const requestId = 'word-search-' + Math.random().toString(36).slice(2);
    latestWordSearchRequestId = requestId;
    document.getElementById("words-note").style.display = "none";
    document.getElementById("words-empty").style.display = "none";
    document.getElementById("words-body").innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--ink-muted,#5B6660)">Searching…</td></tr>';
    document.dispatchEvent(new CustomEvent("lira-search-words", {
      detail: {
        requestId,
        word: state.search.word,
        gloss: state.search.gloss,
        definition: state.search.definition,
        pos: state.pos,
        domain: state.domain,
        rootWordsOnly: state.rootWordsOnly,
        limit: MAX_WORD_ROWS_SHOWN,
      },
    }));
  }, WORD_SEARCH_DEBOUNCE_MS);
}

// Two independent callers share this one event: the Words tab's own
// renderWordsOverCapacity() (latestWordSearchRequestId) and the shared
// selection's own per-id lookup (pendingDetailWordLookups,
// lookupWordForDetailPanel()'s own docstring). requestId alone tells
// them apart -- each caller only ever recognises its own, the same
// pattern the "lira-search-relationships-result" listener already uses.
document.addEventListener("lira-search-words-result", (e) => {
  const { requestId, words, totalMatches } = e.detail;

  if (requestId === latestWordSearchRequestId) {
    lastWordSearchResults = words;
    const body = document.getElementById("words-body");
    const empty = document.getElementById("words-empty");
    const note = document.getElementById("words-note");
    if (words.length === 0) {
      body.innerHTML = "";
      empty.style.display = "block";
      note.style.display = "none";
    } else {
      empty.style.display = "none";
      body.innerHTML = words.map(wordRowHtml).join('');
      if (totalMatches > words.length) {
        note.style.display = "block";
        note.textContent = \`Showing the first \${words.length.toLocaleString()} of \${totalMatches.toLocaleString()} matching words -- narrow your search to see the rest.\`;
      } else {
        note.style.display = "none";
      }
    }
    document.getElementById("stat-words").textContent = TOTAL_WORD_COUNT;
    // Refreshes against the just-updated lastWordSearchResults -- clears
    // the detail panel back to empty if whatever was selected isn't in
    // this search's own results, same as the local-array path's own
    // renderAll() already does for every other search keystroke.
    renderDetailPanel("words");
    return;
  }

  if (pendingDetailWordLookups.has(requestId)) {
    const wordId = pendingDetailWordLookups.get(requestId);
    pendingDetailWordLookups.delete(requestId);
    wordLookupInFlight.delete(wordId);
    if (words.length > 0) wordLookupCache.set(wordId, words[0]);
    else wordLookupFailed.add(wordId);
    // Only re-render if this id is still the shared selection -- a
    // lookup answering a click that's since been superseded by a newer
    // one is simply dropped, same guard latestWordSearchRequestId
    // applies above. All detail panels share this one lookup
    // (selectWord()'s own docstring on why selection is shared), so all
    // of them refresh together rather than each firing its own redundant
    // request for the identical word.
    if (state.selectedWordId === wordId) {
      renderDetailPanel("words");
      renderDetailPanel("phrases");
      renderDetailPanel("senses");
      renderDetailPanel("hierarchy");
      renderDetailPanel("cyclic");
    }
  }
});

// The one place state.selectedWordId is ever written -- every tab's own
// click handler (a Words row, a related-word pivot, a Hierarchy tree
// node, a Cyclic cluster node) calls this instead of keeping its own
// independent selection the way an earlier version of this script did.
// renderAll() then refreshes every view against the new shared value:
// Words (row highlight + detail panel), Relationships (re-scopes its
// own table to just this word, filteredRels()'s/renderRelsOverCapacity()'s
// own docstrings), Hierarchy (re-centres its tree on it, over capacity --
// renderHierarchyOverCapacity()'s own docstring on why there's no
// separate "recentre" step needed beyond this), and Cyclic (highlights
// its own cluster). The Words-row highlight is also toggled directly,
// synchronously, ahead of renderAll()'s own (possibly debounced, over
// capacity) re-render -- a plain class toggle so clicking a row you can
// already see responds instantly instead of waiting on a round trip.
function selectWord(wordId) {
  state.selectedWordId = wordId;
  document.querySelectorAll("#words-body tr[data-word-id], #phrases-body tr[data-word-id], #senses-body tr[data-word-id]").forEach(tr => {
    tr.classList.toggle("selected", tr.dataset.wordId === wordId);
  });
  renderAll();
}

// One PAD (Pleasure-Arousal-Dominance) meter row: a track centred on
// zero, filled from the centre toward the value's sign -- accent
// colour for the named positive pole, the palette's warning red for
// the named negative pole (word.pad's own field docstrings: negative
// means the *named* low/opposite pole, e.g. Displeasure, not just
// "less").
function padMeterRow(posLabel, negLabel, value) {
  const clamped = Math.max(-1, Math.min(1, value));
  const pct = Math.abs(clamped) * 50;
  const negative = clamped < 0;
  const left = negative ? (50 - pct) : 50;
  return \`
    <div class="pad-row">
      <span class="pad-label">\${posLabel} / \${negLabel}</span>
      <span class="pad-track"><span class="pad-fill\${negative ? ' negative' : ''}" style="left:\${left}%;width:\${pct}%"></span></span>
      <span class="pad-value">\${clamped.toFixed(2)}</span>
    </div>\`;
}

// \`rels\` follows relationshipsSectionHTML's own null/[]/populated
// convention -- null while still loading over capacity, so a sense's own
// nested relationship count shows "…" rather than a wrong "0" until the
// real fetch resolves. Always renders at least one sense row (even a
// monosemous Word's own single, always-primary sense) -- Word.senses is
// never empty for a Word that came through WordSeeder, and the one
// existing definition line above already duplicates entry #1's own text,
// so showing it again here is deliberate, not redundant: it's what turns
// "the definition" into "sense 1 of N", and it's the only place a
// monosemous Word's own relationships (now always grouped under a
// Sense, RelationshipRecord.via_sense_id's own docstring) are shown at
// all. Each sense's own relationships are nested in a native
// \`<details>\` -- collapsible with zero extra JS, open by default only
// for the primary sense (the one most callers care about first), closed
// for the rest so a highly polysemous Word ("big", ~15 senses) doesn't
// dump fifteen expanded relationship lists at once.
function sensesSectionHTML(word, rels) {
  if (!word.senses || !word.senses.length) return '';
  return \`
    <div class="detail-section-title">Senses (\${word.senses.length})</div>
    <ol class="sense-list">
      \${word.senses.map((s, i) => {
        const senseRels = rels === null ? null : rels.filter(r => r.via_sense_id === s.id);
        const count = senseRels === null ? '…' : senseRels.length;
        return \`
        <li class="sense-row\${s.is_primary ? ' primary' : ''}">
          <span class="sense-number">\${i + 1}\${s.is_primary ? ' <span class="sense-primary-tag">primary</span>' : ''}</span>
          <span class="sense-definition">\${s.definition || '<span style="opacity:.6">No definition.</span>'}</span>
          <span class="sense-meta">\${domainPill(s.domain)}\${s.frequency !== null ? \` <span class="sense-frequency" title="WordNet tagged-occurrence count (SemCor semantic concordance)">freq \${s.frequency.toLocaleString()}</span>\` : ''}\${s.synonyms.length ? \` <span class="sense-synonyms">synonyms: \${s.synonyms.map(syn => \`<button class="link-btn" data-pivot-id="\${syn.id}">\${syn.text}</button>\`).join(', ')}</span>\` : ''}</span>
          <details class="sense-rels"\${s.is_primary ? ' open' : ''}>
            <summary>Relationships (\${count})</summary>
            <div class="detail-relationships-section">\${relationshipsSectionHTML(senseRels)}</div>
          </details>
        </li>\`;
      }).join('')}
    </ol>
  \`;
}

function padSectionHTML(word) {
  if (!word.pad) {
    return '<div class="detail-section-title">Affect (PAD, seeded)</div><div class="detail-empty" style="padding:4px 0">No PAD value seeded yet.</div>';
  }
  return \`
    <div class="detail-section-title">Affect (PAD, seeded)</div>
    \${padMeterRow('Pleasure', 'Displeasure', word.pad.pleasure)}
    \${padMeterRow('Arousal', 'Non-Arousal', word.pad.arousal)}
    \${padMeterRow('Dominance', 'Submissive', word.pad.dominance)}
  \`;
}

function wordFormsSectionHTML(word) {
  if (!word.word_forms || !word.word_forms.length) {
    return '<div class="detail-section-title">Word Forms</div><div class="detail-empty" style="padding:4px 0">No word forms seeded yet.</div>';
  }
  return \`
    <div class="detail-section-title">Word Forms</div>
    \${word.word_forms.map(f => \`
      <div class="word-form-row">
        <span class="word-form-label">\${f.label}</span>
        <span class="word-form-value">\${f.value}</span>
      </div>\`).join('')}
  \`;
}

// Search results currently shown in the Words tab, over capacity only --
// renderDetailPanel("words") reads a clicked row's own Word data from
// here instead of WORDS (always [] past MAX_INTERACTIVE_WORDS), kept in
// lockstep with whatever the last "lira-search-words-result" rendered.
let lastWordSearchResults = [];

// Words resolved via a direct id lookup (DictionaryView.searchWords()'s
// own \`wordId\` fast path -- see that method's docstring) after
// wordForDetailPanel() couldn't find them in WORDS/lastWordSearchResults
// -- a related word clicked from inside the detail panel itself is very
// often outside whichever list happens to be loaded right now (a
// different search's own results, or nothing fetched there at all over
// capacity). Keyed by id (shared across every panel, now that selection
// itself is shared -- selectWord()'s own docstring), kept for the
// page's whole lifetime -- a resolved Word's own record never changes
// shape under it, so nothing here ever needs invalidating.
// wordLookupFailed tracks the opposite outcome (an id whose lookup came
// back with nothing -- should never happen for a real relationship's
// own source/target id, but a page bug elsewhere or stale data
// shouldn't loop forever re-requesting it) so renderDetailPanel() can
// show a real "not found" message instead of "Loading…" stuck forever.
// wordLookupInFlight/pendingDetailWordLookups together guard against
// the three detail panels (words/hierarchy/cyclic), all now watching
// the same selection, each independently firing an identical lookup
// for the same id in the same renderAll() pass.
const wordLookupCache = new Map();
const wordLookupFailed = new Set();
const wordLookupInFlight = new Set();
const pendingDetailWordLookups = new Map(); // requestId -> wordId

// panel === "phrases" always falls through to wordLookupCache below,
// never a locally-embedded array the way "words" can -- a selected
// Phrase's own detail data (relationship_count/definition_segments/
// domain/pad/phrase_word_segments, wordDetailHTML()'s own fields) only
// ever comes from the shared "lira-search-words"/wordId path
// (DictionaryView.searchWords()'s own Phrases fallback, phraseAsWord()
// plus phraseWordSegments()) -- the Phrases tab's own search results
// (renderPhrasesOverCapacity()'s "lira-search-phrases", plain
// PhraseRecords, phraseRowHtml()'s own leaner shape) are enough for the
// row list but not this.
function wordForDetailPanel(panel) {
  const selectedId = state.selectedWordId;
  if (selectedId === undefined || selectedId === null) return undefined;
  const source = panel === "words" && OVER_CAPACITY ? lastWordSearchResults : WORDS;
  return source.find(w => w.id === selectedId) || wordLookupCache.get(selectedId);
}

// Dispatches a "lira-search-words" lookup for exactly one Word by id
// (PortalShell's own searchWordsBridge() answers it the same way it
// answers every other "lira-search-words" event -- this is just a
// \`wordId\`-only query instead of a text/filter one). A no-op if
// \`wordId\` is already known to fail (wordLookupFailed's own docstring above) or
// already has a request in flight -- renderDetailPanel() calls this
// once per panel that needs it, but only the first actually dispatches.
function lookupWordForDetailPanel(wordId) {
  if (wordLookupFailed.has(wordId) || wordLookupInFlight.has(wordId)) return;
  wordLookupInFlight.add(wordId);
  const requestId = "detail-word-" + Math.random().toString(36).slice(2);
  pendingDetailWordLookups.set(requestId, wordId);
  document.dispatchEvent(new CustomEvent("lira-search-words", {
    detail: { requestId, wordId, limit: 1 },
  }));
}

// Each detail-empty-<panel> element's own static "Select a word..."
// prompt, captured the first time renderDetailPanel() touches it (a
// data-* attribute survives that element being left in place, unlike a
// module-level constant duplicating the template's own text by hand) --
// swapped out for "Loading…" while a lookupWordForDetailPanel() call is
// in flight, then restored once nothing is selected again.
function emptyPanelDefaultText(el) {
  if (el.dataset.defaultText === undefined) el.dataset.defaultText = el.textContent;
  return el.dataset.defaultText;
}

// Relationship lists for the shared selection's own detail-panel view
// (relationshipsSectionHTML()'s own rels array), fetched once per word
// id and reused by every detail panel showing it -- same sharing
// reasoning, and the same in-flight/cache/pending-requestId shape, as
// wordLookupCache/wordLookupInFlight/pendingDetailWordLookups above.
const detailRelsCache = new Map();
const detailRelsInFlight = new Set();
const pendingDetailRelLookups = new Map(); // requestId -> wordId

function fetchDetailRelsIfNeeded(wordId) {
  if (detailRelsCache.has(wordId) || detailRelsInFlight.has(wordId)) return;
  detailRelsInFlight.add(wordId);
  const requestId = 'detail-rels-' + Math.random().toString(36).slice(2);
  pendingDetailRelLookups.set(requestId, wordId);
  document.dispatchEvent(new CustomEvent("lira-search-relationships", {
    detail: { requestId, wordId, limit: 500 },
  }));
}

// \`rels\` is \`null\` while a selected word's own relationship list is
// still loading over capacity (relationshipsSectionHTML's own "Loading…"
// branch) -- distinct from \`[]\`, which means the fetch already resolved
// and there really are none.
function relationshipsSectionHTML(rels) {
  if (rels === null) return '<div class="detail-empty" style="padding:8px 0">Loading relationships…</div>';
  if (rels.length === 0) return '<div class="detail-empty" style="padding:8px 0">No relationships recorded.</div>';
  return rels.map(r => \`
    <div class="rel-entry">
      <div class="rel-row">
        <span class="rel-dir" title="\${r.outgoing ? 'Outgoing' : 'Incoming'}">\${r.outgoing ? '&rarr;' : '&larr;'}</span>
        \${relPill(r.pillKind || r.kind, r.group)}
        <button class="link-btn" data-pivot-id="\${r.otherId}">\${r.otherText}</button>
        \${senseIdBadge(r.otherSenseId)}
        \${domainPill(r.otherDomain)}
      </div>
      <div class="rel-sentence">\${relationshipSentence(r.kind, r.source_text, r.target_text, r.qualifier)}</div>
    </div>\`).join('');
}

// \`rels\` follows relationshipsSectionHTML's own null/[]/populated
// convention. The relationship count in the section header reads off
// \`relCount\` rather than \`rels.length\` specifically so the loading
// state (rels === null) can still show word.relationship_count (already
// known, computed server-side off the real LexicalRelationshipStore
// regardless of scale -- wordRecordFor()'s own relationshipCount) while
// the list itself is still in flight.
// A Phrase's own headword ("toy poodle") linked, token by token, to
// each of its constituent Words -- word.phrase_word_segments's own
// docstring (DictionaryView.phraseWordSegments, dictionary_view.ts) on
// why this exists only for a Phrase-resolved record. Reuses
// definitionSegmentHTML() as-is (same hover-tooltip markup a
// definition's own word tokens already get), joined back together with
// plain spaces -- phrase.words has no punctuation of its own to
// preserve between tokens, just the whitespace isMultiWordLemma()
// itself split on. Falls back to the plain lexical_form for an
// ordinary Word, which never carries this field.
function headwordHTML(word) {
  if (!word.phrase_word_segments || !word.phrase_word_segments.length) return word.lexical_form;
  return \`<span class="def-text">\${word.phrase_word_segments.map(definitionSegmentHTML).join(' ')}</span>\`;
}

// General (non-sense) relationships only -- every semantic (Lexical
// Semantic-group) fact now arrives Sense-expanded and lives nested under
// its own owning sense instead (sensesSectionHTML()'s own docstring); a
// direct edge with no via_sense_id at all (Morphological/Orthographic-
// group kinds -- derivation, spelling variants, ... -- always stay
// direct, WordSeeder.seedPointerRelationship's own docstring) is what's
// left here. \`relCount\`/word.relationship_count is already scoped to
// exactly this (DictionaryView.wordRecordFor()'s own relationshipCount,
// a direct-edges-only count), so no server-side change was needed to
// keep the header number matching what this section actually shows.
function generalRelationships(rels) {
  return rels === null ? null : rels.filter(r => !r.via_sense_id);
}

function wordDetailHTML(word, rels, relCount) {
  return \`
    <div class="detail-word">\${headwordHTML(word)}\${word.is_common ? ' <span class="badge-common">common</span>' : ''}\${word.is_root_word ? ' <span class="badge-root-word">root word</span>' : ''}\${word.is_derivable_noun ? ' <span class="badge-derivable-noun">derivable noun</span>' : ''}\${word.is_fully_hydrated ? '' : ' <span class="badge-common" style="color:#C2544B;border-color:#C2544B">hydration pending</span>'}</div>
    <div style="margin-top:6px">\${posPill(word.pos)} \${domainPill(word.domain)}\${word.phrase_type ? ' ' + phraseTypePill(word.phrase_type) : ''}</div>
    \${word.related_domains && word.related_domains.length ? \`<div class="detail-related-domains" style="margin-top:4px"><span style="opacity:.6">Also:</span> \${word.related_domains.map(domainPill).join(' ')}</div>\` : ''}
    <div class="detail-entry-id" title="Persistent Qualified Word Identity (domain + part of speech + word) -- stable across regenerations, unlike this word's transient graph id">Entry ID <code>\${word.entry_id}</code></div>
    <div class="detail-definition">\${renderDefinition(word)}</div>
    \${sensesSectionHTML(word, rels)}
    \${padSectionHTML(word)}
    \${wordFormsSectionHTML(word)}
    <div class="detail-section-title">Provenance</div>
    <div class="detail-definition" style="margin-top:0">\${word.sources && word.sources.length ? word.sources.map(s => \`<span class="tag">\${s}</span>\`).join('') : '<span style="opacity:.6">No source recorded.</span>'}</div>
    <details class="rel-general" open>
      <summary class="detail-section-title">Other Relationships (<span class="detail-rel-count">\${relCount}</span>)</summary>
      <div class="detail-relationships-section">\${relationshipsSectionHTML(generalRelationships(rels))}</div>
    </details>
  \`;
}

function wireDetailPivotButtons(content) {
  content.querySelectorAll("button[data-pivot-id]").forEach(btn => {
    btn.addEventListener("click", () => selectWord(btn.dataset.pivotId));
  });
}

function renderDetailPanel(panel) {
  const empty = document.getElementById(\`detail-empty-\${panel}\`);
  const content = document.getElementById(\`detail-content-\${panel}\`);
  const selectedId = state.selectedWordId;
  const word = wordForDetailPanel(panel);
  if (!word) {
    content.style.display = "none";
    empty.style.display = "block";
    if (selectedId !== undefined && selectedId !== null && wordLookupFailed.has(selectedId)) {
      empty.textContent = "This word could not be found.";
    } else if (selectedId !== undefined && selectedId !== null) {
      // A selection exists but isn't resolved locally yet -- kick off
      // (or wait on) an id lookup rather than claiming nothing is
      // selected; the "lira-search-words-result" listener below
      // re-renders this panel once it resolves.
      lookupWordForDetailPanel(selectedId);
      empty.textContent = "Loading…";
    } else {
      empty.textContent = emptyPanelDefaultText(empty);
    }
    return;
  }
  const overCapacityRels = OVER_CAPACITY;
  empty.style.display = "none";
  content.style.display = "block";
  const rels = overCapacityRels ? (detailRelsCache.get(word.id) ?? null) : relationshipsForWord(word.id);
  content.innerHTML = wordDetailHTML(word, rels, word.relationship_count);
  wireDetailPivotButtons(content);

  if (overCapacityRels && !detailRelsCache.has(word.id)) {
    fetchDetailRelsIfNeeded(word.id);
  }
}

// Connected components of a relationship-edge list, treating every edge
// as undirected -- shared by the Hierarchy tab's symmetric-kind
// clustering below and the Cyclic tab's cycle-finding (buildCyclicComponents).
function connectedComponents(edges) {
  const undirected = new Map();
  const nodeIds = new Set();
  edges.forEach(r => {
    nodeIds.add(r.source_id);
    nodeIds.add(r.target_id);
    if (!undirected.has(r.source_id)) undirected.set(r.source_id, new Set());
    if (!undirected.has(r.target_id)) undirected.set(r.target_id, new Set());
    undirected.get(r.source_id).add(r.target_id);
    undirected.get(r.target_id).add(r.source_id);
  });
  const visited = new Set();
  const components = [];
  nodeIds.forEach(start => {
    if (visited.has(start)) return;
    const stack = [start];
    const comp = new Set();
    visited.add(start);
    while (stack.length) {
      const cur = stack.pop();
      comp.add(cur);
      (undirected.get(cur) || new Set()).forEach(next => {
        if (!visited.has(next)) { visited.add(next); stack.push(next); }
      });
    }
    components.push(comp);
  });
  return components;
}

// Groups words into genuine cliques of the given edges -- every word in
// a group is directly connected to every other word in that same group,
// not merely reachable through a chain of separate edges. Plain
// connected components get this wrong for a symmetric kind: e.g.
// keep-retain, retain-store, and store-reserve might each be a real,
// direct SYNONYM edge, but that doesn't make "keep" and "reserve"
// synonyms of each other, and a component would have silently merged
// them (and everything else transitively reachable through the chain --
// one real case in this dictionary chained 18 words into a single
// component over just 19 direct edges out of 153 possible pairs, i.e.
// mostly NOT directly related). Grown greedily instead: process words
// alphabetically, start a group with the first unassigned one, then
// keep adding any of its direct neighbours that are *also* directly
// connected to every word already in the group, until no more
// candidates qualify -- every resulting group is a real clique. (This
// is a greedy approximation, not a guaranteed-maximum clique cover -- a
// word already claimed by an earlier, alphabetically-prior group stays
// there even if it would also fit a later one -- but every group it
// produces is still fully, genuinely mutually connected, which is the
// property that matters here.)
function cliqueGroups(edges, wordById) {
  const neighbors = new Map();
  edges.forEach(r => {
    if (!neighbors.has(r.source_id)) neighbors.set(r.source_id, new Set());
    if (!neighbors.has(r.target_id)) neighbors.set(r.target_id, new Set());
    neighbors.get(r.source_id).add(r.target_id);
    neighbors.get(r.target_id).add(r.source_id);
  });
  const byLabel = (a, b) => wordById.get(a).lexical_form.localeCompare(wordById.get(b).lexical_form);
  const assigned = new Set();
  const groups = [];
  [...neighbors.keys()].sort(byLabel).forEach(start => {
    if (assigned.has(start)) return;
    const group = [start];
    [...neighbors.get(start)].filter(id => !assigned.has(id)).sort(byLabel).forEach(candidate => {
      if (group.every(member => neighbors.get(member).has(candidate))) group.push(candidate);
    });
    groups.push(group);
    group.forEach(w => assigned.add(w));
  });
  return { groups, neighbors };
}

// Every mutually-related group of words for a symmetric kind (SYNONYM,
// ANTONYM, RELATED -- any kind where every edge's reverse is also
// stored), used by buildHierarchy's fallback below: keeps every clique
// of 2+ words, not just the more visually interesting larger ones -- a
// plain mutual pair is still a real cluster, just the smallest possible
// one, and Hierarchy's job here is to replace the flat "every word its
// own root" forest entirely, not to single out anything.
function buildClusters(kind) {
  const wordById = new Map(WORDS.map(w => [w.id, w]));
  const edges = RELS.filter(r => r.kind === kind && wordById.has(r.source_id) && wordById.has(r.target_id));
  const clusters = cliqueGroups(edges, wordById).groups.filter(g => g.length >= 2);
  clusters.sort((a, b) => b.length - a.length);
  return { clusters, wordById };
}

// Mirrors the server-side HIERARCHY_INVERTED_KINDS (dictionary_view.ts's
// own DictionaryView.resolveHierarchy(), the class this file's own
// render() method is a method of) -- kept as a literal duplicate rather
// than shared, since that Set lives in TypeScript-enum-keyed code this
// client script has no import access to; the two kind *names* below
// are the stable, load-bearing part, not the enum values behind them.
const HIERARCHY_INVERTED_KINDS = new Set(["HYPERNYM", "MERONYM"]);

// Mirrors the server-side SYMMETRIC_HIERARCHY_KINDS (same class,
// same reasoning as HIERARCHY_INVERTED_KINDS just above for why this
// is a literal duplicate rather than a shared import) -- checked by
// kind, not inferred from "no root candidates" (buildHierarchy()'s own
// \`fellBack\` used to do exactly that, and broke the same way
// resolveHierarchy()'s own version did once SYNONYM/ANTONYM/etc.
// stopped being stored as two edges per fact).
const SYMMETRIC_HIERARCHY_KINDS = new Set(["SYNONYM", "ANTONYM", "VERB_GROUP", "ATTRIBUTE", "ALSO_SEE", "DERIVED_FORM"]);

// Builds the full forest for one relationship kind. source_id becomes
// the parent, target_id the child for most kinds -- the same literal
// (source, kind, target) triple the Relationships tab already shows --
// *except* HIERARCHY_INVERTED_KINDS (HYPERNYM, MERONYM), which are
// stored (narrower/part, kind, broader/whole) --
// source is the *child* for these, not the parent, so building the tree
// straight off source/target would put narrower concepts to the tree's
// own root side and broader ones toward the leaves, backwards from
// "broad root, narrow leaves".
// Mirrors resolveHierarchy()'s own server-side HIERARCHY_INVERTED_KINDS
// swap (dictionary_view.ts's server-side class) so the under-capacity
// and WordNet-scale paths agree on which side of a HYPERNYM-like edge
// is broader, not just this client script's own two rendering paths
// agreeing with each other.
// Roots are words with no incoming edge of this kind -- except
// SYMMETRIC_HIERARCHY_KINDS (SYNONYM, ANTONYM, ...), which fall back to
// buildClusters unconditionally regardless of what root-detection would
// say, rather than a forest of redundant per-word roots (each of which
// would otherwise show largely the same members as every other root in
// the same mutually-related group). Named explicitly, not inferred from
// "zero root candidates" -- SYMMETRIC_HIERARCHY_KINDS's own docstring
// on why that check alone stopped being reliable.
//
// When state.selectedWordId names a word that's actually part of this
// kind's graph, the returned tree is centred on it instead of showing
// every root's own full forest -- the under-capacity counterpart to
// resolveHierarchy()'s own server-side wordId mode (dictionary_view.ts's
// server-side class), mirrored here rather than shared with it since
// this path runs entirely against the already-embedded WORDS/RELS
// arrays: walk *up* the first-parent-at-each-step chain to build a
// single ancestor path (not every ancestor's other children -- a
// multiply-inherited node, e.g. two WordNet hypernyms, picks one path,
// same rare-case tradeoff the server-side version makes), then descend
// from the selected word's own real children as normal, capped at
// HIERARCHY_NODE_LIMIT the same way an over-capacity request is. Falls
// through to the full, unscoped forest if nothing is selected or the
// selection isn't part of this kind's graph at all (centred stays
// false either way -- renderHierarchy()'s own docstring on the latter
// case, which gets its own explicit "no relationships for this word"
// message rather than silently showing the unrelated full forest).
function buildHierarchy(kind) {
  const edges = RELS.filter(r => r.kind === kind);
  const wordById = new Map(WORDS.map(w => [w.id, w]));
  const inverted = HIERARCHY_INVERTED_KINDS.has(kind);
  const childrenOf = new Map();
  const parentsOf = new Map();
  const hasIncoming = new Set();
  const nodeIds = new Set();
  edges.forEach(r => {
    if (!wordById.has(r.source_id) || !wordById.has(r.target_id)) return;
    const parentId = inverted ? r.target_id : r.source_id;
    const childId = inverted ? r.source_id : r.target_id;
    nodeIds.add(parentId);
    nodeIds.add(childId);
    hasIncoming.add(childId);
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId).push(childId);
    if (!parentsOf.has(childId)) parentsOf.set(childId, []);
    parentsOf.get(childId).push(parentId);
  });
  const byLabel = id => (wordById.get(id) || {}).lexical_form || "";
  let roots = [...nodeIds].filter(id => !hasIncoming.has(id));
  const fellBack = SYMMETRIC_HIERARCHY_KINDS.has(kind) ? nodeIds.size > 0 : roots.length === 0 && nodeIds.size > 0;
  let clusters = null;
  let centred = false;
  let shownNodeCount = nodeIds.size;
  let truncated = false;
  const selectedId = state.selectedWordId;
  if (fellBack) {
    clusters = buildClusters(kind).clusters;
  } else if (selectedId && nodeIds.has(selectedId)) {
    centred = true;
    const ancestorChain = [];
    let cur = selectedId;
    const seen = new Set([cur]);
    for (;;) {
      const parents = parentsOf.get(cur);
      if (!parents || !parents.length) break;
      const next = parents[0];
      if (seen.has(next)) break;
      ancestorChain.push(next);
      seen.add(next);
      cur = next;
    }
    ancestorChain.reverse();

    const scopedChildrenOf = new Map();
    for (let i = 0; i < ancestorChain.length; i++) {
      scopedChildrenOf.set(ancestorChain[i], [i + 1 < ancestorChain.length ? ancestorChain[i + 1] : selectedId]);
    }
    const included = new Set(ancestorChain);
    included.add(selectedId);
    const queue = [selectedId];
    let queueIndex = 0;
    while (queueIndex < queue.length) {
      const current = queue[queueIndex];
      queueIndex += 1;
      const kids = (childrenOf.get(current) || []).slice().sort((a, b) => byLabel(a).localeCompare(byLabel(b)));
      const list = [];
      kids.forEach(childId => {
        if (!included.has(childId) && included.size >= HIERARCHY_NODE_LIMIT) { truncated = true; return; }
        list.push(childId);
        if (!included.has(childId)) { included.add(childId); queue.push(childId); }
      });
      if (list.length) scopedChildrenOf.set(current, list);
    }
    roots = [ancestorChain.length ? ancestorChain[0] : selectedId];
    shownNodeCount = included.size;
    return { roots, childrenOf: scopedChildrenOf, wordById, edgeCount: edges.length, nodeCount: nodeIds.size, fellBack, clusters, centred, shownNodeCount, truncated, inverted };
  } else {
    roots.sort((a, b) => byLabel(a).localeCompare(byLabel(b)));
    childrenOf.forEach(list => list.sort((a, b) => byLabel(a).localeCompare(byLabel(b))));
  }
  return { roots, childrenOf, wordById, edgeCount: edges.length, nodeCount: nodeIds.size, fellBack, clusters, centred, shownNodeCount, truncated, inverted };
}

function hierarchyClusterHTML(cluster, wordById) {
  const words = cluster.map(id => wordById.get(id)).filter(Boolean);
  return \`<div class="hierarchy-cluster">
    <div class="hierarchy-cluster-title">\${words.length} words clustered together</div>
    <div class="hierarchy-cluster-words">\${words.map(w =>
      \`<span class="hierarchy-cluster-chip"><button class="link-btn" data-pivot-id="\${w.id}">\${w.lexical_form}</button> \${posPill(w.pos)}</span>\`
    ).join('')}</div>
  </div>\`;
}

// Every id in \`ids\` that shares a WordNet synset (sense_id) is grouped
// into one array, in first-encountered order -- a word with no
// sense_id (not WordNet-sourced) gets a singleton group of its own,
// same as a synset none of whose fellow members are also in \`ids\`.
// hierarchyTreeSVG's own boxing: WordNet's pointer data fans a HYPERNYM
// (or any other) edge out to *every* member of the target synset
// individually (word_seeder.ts's own seedPointerRelationship docstring
// -- "dog"/"domestic dog"/"Canis familiaris" all separately, for the
// identical fact), so without this a tree would show three redundant
// sibling branches for what's really one concept.
function groupIdsBySense(ids, tree) {
  const bySense = new Map();
  const order = [];
  ids.forEach(id => {
    const word = tree.wordById.get(id);
    if (!word) return;
    const key = word.sense_id ? "s:" + word.sense_id : "w:" + id;
    if (!bySense.has(key)) { bySense.set(key, []); order.push(key); }
    bySense.get(key).push(id);
  });
  return order.map(key => bySense.get(key));
}

// Lays out a Hierarchy tree as a left-to-right dendrogram (root column
// at the left, each generation one column further right) instead of an
// indented text list -- an org-chart-style node-and-edge diagram reads
// the actual branching shape of a hierarchy at a glance, the same way
// Cyclic's own box-and-line graph (clusterGraphSVG below) does for its
// cluster relationships, rather than asking the eye to reconstruct it
// from indentation depth. Every *occurrence* here is actually a
// same-synset GROUP (groupIdsBySense above), rendered as a boxed,
// multi-line cluster (mirroring clusterGraphSVG's own per-word-in-box
// treatment) when it has more than one member, or a plain dot + label
// -- unchanged from a single word's own old rendering -- when it doesn't,
// so a non-WordNet hierarchy (e.g. Lemma Form, where sense_id is never
// set) never shows an unnecessary box around every single node.
//
// \`inverted\` (HIERARCHY_INVERTED_KINDS.has(kind)) flips which end of a
// connecting line gets the arrowhead, independent of layout position:
// tree.childrenOf already orients parent = broader/root-ward,
// child = narrower/leaf-ward for these kinds (buildHierarchy()'s own
// docstring on why), but the *edge itself* is still stored child->parent
// (the narrower word's own HYPERNYM pointer names its broader parent),
// so the arrow needs to point from the child's own position back toward
// the parent's -- backward along the tree's own left-to-right layout --
// to actually depict that stored direction, not the reverse.
//
// One pass assigns every group's row top-down, pre-order: a node is
// placed at the next free row *before* its own children are laid out,
// which then stack immediately beneath it -- not the classic centred-
// dendrogram rule (a parent positioned at the midpoint of its already-
// laid-out children), deliberately. WordNet's own broadest root, e.g.
// "entity" for Hypernym, can have hundreds of thousands of descendants;
// centring it over all of them buries its own row deep in the middle of
// a many-thousand-pixel-tall diagram, nowhere near the top a reader
// actually sees first -- exactly the "entity isn't at the top of the
// hierarchy" bug this pre-order layout avoids. Pre-order also means the
// row order matches the old indented text list's own top-to-bottom
// reading order exactly (root, then its first child's whole subtree,
// then its second child's, ...), just drawn instead of indented. Depth
// fixes the column (x); row fixes the vertical position (y) once scaled
// by each row's own height (a multi-member box is taller than a single
// dot, same as clusterGraphSVG's own boxDims).
//
// Two independent guards keep this finite even though the underlying
// graph isn't guaranteed to be a tree (or even acyclic) -- the same
// pair the old text-list version used, now keyed by group rather than
// word: pathSet catches a true cycle within the current branch,
// globalSeen catches a group reached a second time via a *different*
// parent (a legitimate DAG shape, e.g. a word with two hypernyms). Both
// render as a dashed, non-expanding leaf rather than re-entering the
// subtree -- but as their own *occurrence* (a fresh synthetic id,
// tracked separately from any member's own word id), because the same
// group can legitimately appear at more than one position in the
// diagram; edges and layout are keyed by occurrence, so two occurrences
// of one group never fight over a single position, while data-pivot-id
// on every member row still names that member's own real word id for
// click/selection purposes.
function hierarchyTreeSVG(tree, inverted) {
  const LINE_H = 15, ROW_GAP = 12, COL_GAP = 46, MARGIN = 20;
  const occY = new Map();
  const occurrences = [];
  const edges = [];
  let cursorY = MARGIN;
  let occSeq = 0;

  function dims(members) {
    if (members.length === 1) return { width: Math.max(60, members[0].lexical_form.length * 6.3 + 30), height: 22, boxed: false };
    const width = Math.max(70, Math.max(...members.map(m => m.lexical_form.length)) * 6.6 + 30);
    const height = members.length * LINE_H + 14;
    return { width, height, boxed: true };
  }

  function groupKey(group) {
    const word = tree.wordById.get(group[0]);
    return word.sense_id ? "s:" + word.sense_id : "w:" + group[0];
  }

  function visit(group, depth, pathSet, globalSeen) {
    const members = group.map(id => tree.wordById.get(id)).filter(Boolean);
    if (!members.length) return null;
    const key = groupKey(group);
    const occId = "o" + (occSeq++);
    const { width, height, boxed } = dims(members);
    const base = { occId, ids: group, members, depth, width, height, boxed };

    const pushLeaf = kind => {
      const oy = cursorY + height / 2;
      cursorY += height + ROW_GAP;
      occY.set(occId, oy);
      occurrences.push({ ...base, kind });
      return occId;
    };

    if (pathSet.has(key)) return pushLeaf("cycle");

    const childIdsRaw = [];
    group.forEach(id => (tree.childrenOf.get(id) || []).forEach(c => childIdsRaw.push(c)));
    const childGroups = groupIdsBySense([...new Set(childIdsRaw)], tree);

    const firstTimeSeen = !globalSeen.has(key);
    globalSeen.add(key);
    if ((!firstTimeSeen || depth > 14) && childGroups.length) return pushLeaf("seen");
    if (!childGroups.length) return pushLeaf(null);

    // Place this node's own row *before* recursing -- pre-order, not
    // the midpoint-of-children rule pushLeaf's sibling case doesn't
    // need (a leaf has no children to be misplaced relative to).
    const oy = cursorY + height / 2;
    cursorY += height + ROW_GAP;
    occY.set(occId, oy);
    occurrences.push({ ...base, kind: null });

    const nextPath = new Set(pathSet);
    nextPath.add(key);
    const childOccIds = childGroups.map(g => visit(g, depth + 1, nextPath, globalSeen)).filter(Boolean);
    childOccIds.forEach(childOccId => edges.push({ parentOccId: occId, childOccId }));
    return occId;
  }

  groupIdsBySense(tree.roots, tree).forEach(group => visit(group, 0, new Set(), new Set()));
  if (!occurrences.length) return "";

  const maxDepth = Math.max(...occurrences.map(o => o.depth));
  const colWidthByDepth = [];
  for (let d = 0; d <= maxDepth; d++) {
    colWidthByDepth.push(Math.max(...occurrences.filter(o => o.depth === d).map(o => o.width)));
  }
  const colX = [MARGIN];
  for (let d = 1; d <= maxDepth; d++) colX.push(colX[d - 1] + colWidthByDepth[d - 1] + COL_GAP);

  const width = colX[maxDepth] + colWidthByDepth[maxDepth] + MARGIN;
  const height = cursorY + MARGIN;
  const occById = new Map(occurrences.map(o => [o.occId, o]));
  const y = occId => occY.get(occId);
  const x = occId => colX[occById.get(occId).depth];

  let linesHTML = "";
  edges.forEach(({ parentOccId, childOccId }) => {
    const parentOcc = occById.get(parentOccId), childOcc = occById.get(childOccId);
    const px = x(parentOccId) + parentOcc.width, py = y(parentOccId);
    const cx = x(childOccId), cy = y(childOccId);
    const branchX = px + (cx - px) / 2;
    // \`inverted\` swaps which endpoint the arrowhead sits at -- the line
    // itself always runs the same visual path (parent's own right edge
    // to child's own left edge, the layout's own broad-to-narrow
    // direction), only marker-start/marker-end trade places.
    const startMarker = inverted ? \` marker-start="url(#hierarchy-arrow)"\` : '';
    const endMarker = inverted ? '' : \` marker-end="url(#hierarchy-arrow)"\`;
    linesHTML += \`<path d="M\${px.toFixed(1)},\${py.toFixed(1)} H\${branchX.toFixed(1)} V\${cy.toFixed(1)} H\${cx.toFixed(1)}" class="hierarchy-edge"\${startMarker}\${endMarker} />\`;
  });

  let nodesHTML = "";
  occurrences.forEach(o => {
    const nx = x(o.occId), ny = y(o.occId);
    const crossRef = o.kind ? " hierarchy-node-cross-ref" : "";
    const title = o.kind === "cycle" ? "cycle -- already above in this branch" : o.kind === "seen" ? "see elsewhere in this tree" : "";
    const titleHTML = title ? \`<title>\${title}</title>\` : '';
    const suffix = o.kind ? ' ⋯' : '';
    if (!o.boxed) {
      const m = o.members[0];
      const color = POS_COLORS[m.pos] || "#7A7A7A";
      const isSelected = m.id === state.selectedWordId;
      nodesHTML += \`<g class="hierarchy-node-svg\${isSelected ? ' hierarchy-node-selected' : ''}\${crossRef}" data-pivot-id="\${m.id}" tabindex="0" transform="translate(\${nx.toFixed(1)},\${ny.toFixed(1)})">\`
        + titleHTML + \`<circle r="4" fill="\${color}" />\`
        + \`<text x="9" y="4" text-anchor="start">\${m.lexical_form}\${suffix}</text></g>\`;
      return;
    }
    const top = ny - o.height / 2;
    nodesHTML += \`<g class="hierarchy-node-group\${crossRef}">\`
      + titleHTML
      + \`<rect x="\${nx.toFixed(1)}" y="\${top.toFixed(1)}" width="\${o.width.toFixed(1)}" height="\${o.height.toFixed(1)}" rx="6" class="hierarchy-box" />\`;
    o.members.forEach((m, idx) => {
      const color = POS_COLORS[m.pos] || "#7A7A7A";
      const isSelected = m.id === state.selectedWordId;
      const my = top + 11 + idx * LINE_H;
      nodesHTML += \`<g class="hierarchy-node-svg\${isSelected ? ' hierarchy-node-selected' : ''}" data-pivot-id="\${m.id}" tabindex="0" transform="translate(\${(nx + 10).toFixed(1)},\${my.toFixed(1)})">\`
        + \`<circle r="3.5" cx="0" fill="\${color}" />\`
        + \`<text x="8" y="4" text-anchor="start">\${m.lexical_form}\${idx === o.members.length - 1 ? suffix : ''}</text></g>\`;
    });
    nodesHTML += '</g>';
  });

  return \`<div class="hierarchy-svg-wrap"><svg viewBox="0 0 \${width} \${height}" width="\${width}" height="\${height}" class="hierarchy-graph">\`
    + \`<defs><marker id="hierarchy-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\`
    + \`<path d="M0,0 L10,5 L0,10 z" class="hierarchy-arrow" /></marker></defs>\`
    + \`\${linesHTML}\${nodesHTML}</svg></div>\`;
}

// Wires click/keyboard selection for every node hierarchyTreeSVG() just
// drew into \`container\` -- the same click-or-Enter/Space pattern
// clusterGraphSVG's own \`.cyclic-node[data-pivot-id]\` wiring uses,
// mirrored here rather than shared with it since the two draw into
// different containers at different times.
function wireHierarchyGraphNodes(container) {
  container.querySelectorAll(".hierarchy-node-svg[data-pivot-id]").forEach(node => {
    node.addEventListener("click", () => selectWord(node.dataset.pivotId));
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectWord(node.dataset.pivotId); }
    });
  });
}

// Server-resolved Hierarchy trees (over MAX_INTERACTIVE_WORDS) are
// capped at this many nodes -- resolveHierarchy()'s own default
// (DictionaryView.resolveHierarchy(), dictionary_view.ts's server-side
// class), passed explicitly here so this file's own docstring lives
// next to the number actually sent, not just the server-side default it
// happens to match.
const HIERARCHY_NODE_LIMIT = 500;

function renderHierarchy() {
  if (OVER_CAPACITY) {
    renderHierarchyOverCapacity();
    return;
  }
  const note = document.getElementById("hierarchy-note");
  const container = document.getElementById("hierarchy-tree");
  if (!state.hierarchyKind) {
    note.textContent = "No relationships in this Dictionary yet.";
    container.innerHTML = "";
    return;
  }
  const tree = buildHierarchy(state.hierarchyKind);

  if (tree.fellBack) {
    // Symmetric kind (every edge's reverse is also stored, e.g. SYNONYM)
    // -- a tree of per-word roots would be almost entirely redundant
    // (each root's children are largely the same mutually-related
    // group as every other root's), so cluster instead: one group per
    // set of mutually-related words.
    const clusters = tree.clusters;
    const totalWords = new Set(clusters.flat()).size;
    const parts = [
      \`\${tree.edgeCount} edge\${tree.edgeCount === 1 ? '' : 's'}\`,
      \`\${clusters.length} cluster\${clusters.length === 1 ? '' : 's'}\`,
      \`\${totalWords} word\${totalWords === 1 ? '' : 's'}\`,
    ];
    note.textContent = parts.join(" · ")
      + " -- every word here has both an incoming and an outgoing edge of this kind (a symmetric relationship), so mutually related words are grouped into clusters instead of a tree of largely-redundant roots.";
    if (!clusters.length) {
      container.innerHTML = '<div class="detail-empty" style="padding:8px 0">No relationships of this kind yet.</div>';
      return;
    }
    container.innerHTML = \`<div class="hierarchy-clusters">\${clusters.map(c => hierarchyClusterHTML(c, tree.wordById)).join('')}</div>\`;
    container.querySelectorAll("button[data-pivot-id]").forEach(btn => {
      btn.addEventListener("click", () => selectWord(btn.dataset.pivotId));
    });
    return;
  }

  // A word is selected but has no edges of this kind at all -- distinct
  // from "no relationships of this kind yet" below, which is about the
  // whole Dictionary, not the selection specifically. Without this
  // check the code below would silently fall through to the full,
  // unscoped forest (buildHierarchy()'s own centred=false case), which
  // reads exactly like the "selection is ignored" bug this whole
  // function exists to fix.
  if (state.selectedWordId && !tree.centred) {
    const selWord = WORDS.find(w => w.id === state.selectedWordId);
    note.innerHTML = \`No relationships of this kind for <strong>\${selWord ? selWord.lexical_form : 'the selected word'}</strong>. \`
      + '<button type="button" class="link-btn" id="hierarchy-reset">show the full tree</button>';
    document.getElementById("hierarchy-reset").addEventListener("click", () => selectWord(null));
    container.innerHTML = "";
    return;
  }

  if (tree.centred) {
    const selWord = tree.wordById.get(state.selectedWordId);
    const parts = [
      \`\${tree.edgeCount} total edge\${tree.edgeCount === 1 ? '' : 's'} of this kind\`,
      \`\${tree.nodeCount} total word\${tree.nodeCount === 1 ? '' : 's'}\`,
      \`showing \${tree.shownNodeCount}\${tree.truncated ? '+' : ''}\`,
    ];
    note.innerHTML = parts.join(" · ")
      + (selWord ? \` -- centred on <strong>\${selWord.lexical_form}</strong>\` : "")
      + (tree.truncated ? ' <span class="hierarchy-cross-ref">(narrowed by node limit -- click a word below to centre the tree there)</span>' : '')
      + ' &middot; <button type="button" class="link-btn" id="hierarchy-reset">back to full tree</button>';
    document.getElementById("hierarchy-reset").addEventListener("click", () => selectWord(null));
  } else {
    const parts = [
      \`\${tree.edgeCount} edge\${tree.edgeCount === 1 ? '' : 's'}\`,
      \`\${tree.nodeCount} word\${tree.nodeCount === 1 ? '' : 's'}\`,
      \`\${tree.roots.length} root\${tree.roots.length === 1 ? '' : 's'}\`,
    ];
    note.textContent = parts.join(" · ");
  }
  if (!tree.roots.length) {
    container.innerHTML = '<div class="detail-empty" style="padding:8px 0">No relationships of this kind yet.</div>';
    return;
  }
  container.innerHTML = hierarchyTreeSVG(tree, tree.inverted);
  wireHierarchyGraphNodes(container);
}

// The over-capacity counterpart to renderHierarchy()'s own local-array
// path: instead of building a forest from an already-embedded RELS
// array (there isn't one -- MAX_INTERACTIVE_WORDS's own docstring),
// this dispatches a "lira-resolve-hierarchy" DOM event and waits for
// whatever's listening (PortalShell's own resolveHierarchyBridge()) to
// resolve it server-side (DictionaryView.resolveHierarchy()) and fire
// back "lira-resolve-hierarchy-result". \`state.selectedWordId\` doubles
// as this view's own "centre word" here (undefined/null means "show
// this kind's own broadest root" -- resolveHierarchy()'s own no-wordId
// mode) -- the same shared selection every other tab reads
// (selectWord()'s own docstring): clicking any node calls selectWord()
// like everywhere else, which re-centres the whole tree on it as a
// natural consequence of renderAll() calling this function again with
// the new selection, rather than a Hierarchy-only "recentre" step. There
// is no small, bounded "this word's own relationships" view to fall
// back on at this scale, so the tree itself has to be the navigable
// surface.
function renderHierarchyOverCapacity() {
  const note = document.getElementById("hierarchy-note");
  const container = document.getElementById("hierarchy-tree");
  if (!state.hierarchyKind) {
    note.textContent = "No relationships in this Dictionary yet.";
    container.innerHTML = "";
    return;
  }
  note.textContent = "Loading…";
  container.innerHTML = "";
  const requestId = 'hierarchy-' + Math.random().toString(36).slice(2);
  latestHierarchyRequestId = requestId;
  document.dispatchEvent(new CustomEvent("lira-resolve-hierarchy", {
    detail: { requestId, kind: state.hierarchyKind, wordId: state.selectedWordId || undefined, limit: HIERARCHY_NODE_LIMIT },
  }));
}

let latestHierarchyRequestId = null;

document.addEventListener("lira-resolve-hierarchy-result", (e) => {
  const { requestId, nodes, edges, roots, totalEdgeCount, totalNodeCount, fellBack, truncated } = e.detail;
  if (requestId !== latestHierarchyRequestId) return; // superseded by a later request
  const note = document.getElementById("hierarchy-note");
  const container = document.getElementById("hierarchy-tree");

  if (fellBack) {
    note.textContent = \`\${totalEdgeCount.toLocaleString()} edges -- every word touched by this kind has both an incoming and an outgoing edge (a symmetric relationship), so there's no meaningful root to centre a tree on. Search the Relationships tab instead.\`;
    container.innerHTML = "";
    return;
  }
  if (!nodes.length) {
    note.textContent = "No relationships of this kind yet.";
    container.innerHTML = "";
    return;
  }

  const wordById = new Map(nodes.map(n => [n.id, n]));
  const childrenOf = new Map();
  edges.forEach(({ parentId, childId }) => {
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId).push(childId);
  });
  childrenOf.forEach(list => list.sort((a, b) => (wordById.get(a)?.lexical_form || "").localeCompare(wordById.get(b)?.lexical_form || "")));
  const tree = { wordById, childrenOf, roots };

  const centreWord = state.selectedWordId ? wordById.get(state.selectedWordId) : null;
  const parts = [
    \`\${totalEdgeCount.toLocaleString()} total edge\${totalEdgeCount === 1 ? '' : 's'} of this kind\`,
    \`\${totalNodeCount.toLocaleString()} total word\${totalNodeCount === 1 ? '' : 's'}\`,
    \`showing \${nodes.length.toLocaleString()}\${truncated ? '+' : ''}\`,
  ];
  note.innerHTML = parts.join(" · ")
    + (centreWord ? \` -- centred on <strong>\${centreWord.lexical_form}</strong>\` : " -- centred on this kind's broadest root")
    + (truncated ? ' <span class="hierarchy-cross-ref">(narrowed by node limit -- click a word below to centre the tree there)</span>' : '')
    + (state.selectedWordId ? ' &middot; <button type="button" class="link-btn" id="hierarchy-reset">back to broadest root</button>' : '');

  container.innerHTML = hierarchyTreeSVG(tree, HIERARCHY_INVERTED_KINDS.has(state.hierarchyKind));
  wireHierarchyGraphNodes(container);
  const resetBtn = document.getElementById("hierarchy-reset");
  if (resetBtn) resetBtn.addEventListener("click", () => selectWord(null));
});

// SYNONYM defines the boxes here -- via cliqueGroups above, so only
// words that are ALL directly synonymous with EACH OTHER go in the same
// box, not merely reachable from one another through a chain of
// separate synonym pairs (see cliqueGroups' own comment for why that
// distinction matters and a real example from this dictionary). A word
// with no SYNONYM edge at all still needs a box to be a valid line
// endpoint, so it gets a box of its own.
function synonymBoxes(wordById) {
  const synEdges = RELS.filter(r => r.kind === "SYNONYM" && wordById.has(r.source_id) && wordById.has(r.target_id));
  const boxOfWord = new Map();
  const wordsOfBox = new Map();
  cliqueGroups(synEdges, wordById).groups.forEach((box, i) => {
    const id = "syn" + i;
    wordsOfBox.set(id, box);
    box.forEach(w => boxOfWord.set(w, id));
  });
  function boxFor(wordId) {
    if (boxOfWord.has(wordId)) return boxOfWord.get(wordId);
    const id = "single_" + wordId;
    wordsOfBox.set(id, [wordId]);
    boxOfWord.set(wordId, id);
    return id;
  }
  return { boxFor, wordsOfBox };
}

// For one chosen non-SYNONYM kind, draws the lines *between* synonym
// boxes: an ANTONYM edge from present to missing becomes a line from
// present's box (present + current) to missing's box, so you see the
// synonym pair held together and its antonym relationships fanning out
// from it, not scattered across separate unconnected views the way a
// plain per-word graph would show them. Groups (independent connected
// sets of boxes, so unrelated pairs don't share one giant drawing) are
// found the same way buildCyclicComponents used to find word-level
// cycles, just one level up -- boxes are the nodes here, not words.
function buildClusterGraphs(kind) {
  const wordById = new Map(WORDS.map(w => [w.id, w]));
  const { boxFor, wordsOfBox } = synonymBoxes(wordById);
  const kindEdges = RELS.filter(r => r.kind === kind && wordById.has(r.source_id) && wordById.has(r.target_id));
  const boxEdges = kindEdges.map(r => ({ ...r, sourceBox: boxFor(r.source_id), targetBox: boxFor(r.target_id) }));
  const boxGraphEdges = boxEdges.map(e => ({ source_id: e.sourceBox, target_id: e.targetBox }));

  const groups = [];
  connectedComponents(boxGraphEdges).forEach(boxIdSet => {
    if (boxIdSet.size < 2) return;
    const clusters = [...boxIdSet]
      .map(id => ({ id, wordIds: wordsOfBox.get(id).slice().sort((a, b) => wordById.get(a).lexical_form.localeCompare(wordById.get(b).lexical_form)) }))
      .sort((a, b) => wordById.get(a.wordIds[0]).lexical_form.localeCompare(wordById.get(b.wordIds[0]).lexical_form));
    const edges = boxEdges.filter(e => boxIdSet.has(e.sourceBox) && boxIdSet.has(e.targetBox));
    groups.push({ clusters, edges });
  });
  groups.sort((a, b) => b.clusters.length - a.clusters.length);
  return { groups, wordById };
}

// Each word inside a box gets its own position along a small vertical
// stack, so a line lands on the specific word it's from/to, not just
// the box's centre -- present's antonym line and current's antonym
// line are visually distinguishable even though both start inside the
// same box.

// Which side of a raw (source, kind, target) edge names the *broader*
// term, for every kind with a genuine broader/narrower direction
// ("type of", "part of") -- as opposed to a symmetric kind like
// ANTONYM, which has no broader side at all. Matches each kind's own
// stored direction convention (assets/common/en/relationships/README.md,
// examples/physics_domain_relationships.py's Directional conventions):
// HYPERNYM is (narrower, HYPERNYM, broader) -- broader is the target;
// HYPONYM is (broader, HYPONYM, narrower) -- broader is the source;
// MERONYM is (part, MERONYM, whole) -- the whole is broader, the target;
// HOLONYM is (whole, HOLONYM, part) -- the whole is broader, the source;
// TROPONYM is (general, TROPONYM, specific) -- the general verb is
// broader, the source (troponymy is verb-specific hyponymy, so its
// "broader" side reads the same way HYPERNYM's does for nouns).
const HIERARCHY_BROADER_SIDE = {
  HYPERNYM: "target", HYPONYM: "source",
  MERONYM: "target", HOLONYM: "source",
  TROPONYM: "source",
};

// Distance, in box-graph hops, from the group's most-connected box
// (BFS, edges treated as undirected -- a box's actual line direction
// under the selected kind doesn't determine which side of the layout
// it belongs on, only how far it is from the hub). Ties for "most
// connected" broken alphabetically by the box's first word, for
// determinism. Used by clusterGraphSVG to place boxes in left-to-right
// columns by level -- most lines then run from a column to the next
// one over, reading left to right.
//
// For a kind in HIERARCHY_BROADER_SIDE, this undirected/most-connected
// approach is skipped entirely in favour of hierarchyLevels() below --
// broader-than-narrower has a real meaning for these kinds, so the
// broadest box always belongs at column 0 (left), not whichever box
// happens to have the most edges.
//
// flatten folds every level down to its BFS-distance *parity*
// (level % 2) instead of the raw hop count -- two columns only (the
// hub's, and everything else's), same as a plain min(level, 1) clamp,
// but clamping breaks the "lines read left to right" goal the moment
// a box lands two-or-more hops out: box C, reachable only through
// B (itself one hop from the hub), clamps to the same column as B,
// so the real B-C edge is drawn within one column -- vertical, not
// left-to-right. Parity avoids this: C is two hops out (even), same
// parity as the hub (column 0), while B is one hop out (odd, column
// 1) -- so the B-C edge still crosses from column 0 to column 1,
// exactly like every other edge, as long as the box graph is
// bipartite (true here: ANTONYM is symmetric with no inherent
// hierarchy, so a chain of antonym-sharing boxes alternates like a
// path, never closing an odd cycle back on itself in practice). Used
// for a symmetric kind like ANTONYM, where a box two hops from the
// hub isn't the hub's antonym at all, just something its antonym
// happens to also oppose (a coincidence of two unrelated word pairs
// sharing one box) -- DEPTH_CAPPED_KINDS below opts specific kinds
// into this.
function undirectedLevels(clusters, edges, flatten) {
  const adjacency = new Map();
  clusters.forEach(c => adjacency.set(c.id, new Set()));
  edges.forEach(e => {
    adjacency.get(e.sourceBox).add(e.targetBox);
    adjacency.get(e.targetBox).add(e.sourceBox);
  });
  const byLabel = (a, b) => a.wordIds[0].localeCompare(b.wordIds[0]);
  const root = clusters.slice().sort((a, b) => (adjacency.get(b.id).size - adjacency.get(a.id).size) || byLabel(a, b))[0];

  const level = new Map();
  level.set(root.id, 0);
  const queue = [root.id];
  while (queue.length) {
    const cur = queue.shift();
    adjacency.get(cur).forEach(next => {
      if (!level.has(next)) { level.set(next, level.get(cur) + 1); queue.push(next); }
    });
  }
  clusters.forEach(c => { if (!level.has(c.id)) level.set(c.id, 0); });
  if (flatten) {
    level.forEach((lvl, id) => level.set(id, lvl % 2));
  }
  return level;
}

// Column 0 (left) is always the broadest term for a hierarchy kind --
// a box's level is the length of its longest directed path, along the
// narrower-to-broader edges HIERARCHY_BROADER_SIDE derives from the
// raw edges, up to a box with no broader term of its own within this
// group (a "root" of the hierarchy: nothing here is broader than it).
// Plain memoised recursion over that DAG, broadest boxes (out-degree 0
// in the narrower->broader direction) hitting the base case first.
// \`visiting\` breaks a cycle defensively (two boxes each claiming to be
// broader than the other, e.g. from two different word-level edges
// landing on the same box pair in opposite directions) by treating the
// back-edge's target as already resolved at level 0 rather than
// recursing forever -- the same guard style hierarchyTreeSVG uses for
// the Hierarchy tab's own tree. Multiple broader terms (e.g. "aircraft"
// having both "machine" and "vehicle" as hypernyms) place the box one
// column to the right of *all* of them, via the max() below, so every
// broader-to-narrower edge still reads strictly left to right.
function hierarchyLevels(clusters, edges, kind) {
  const broaderSide = HIERARCHY_BROADER_SIDE[kind];
  const narrowerToBroader = new Map();
  clusters.forEach(c => narrowerToBroader.set(c.id, new Set()));
  edges.forEach(e => {
    const broader = broaderSide === "source" ? e.sourceBox : e.targetBox;
    const narrower = broaderSide === "source" ? e.targetBox : e.sourceBox;
    if (narrower !== broader) narrowerToBroader.get(narrower).add(broader);
  });

  const level = new Map();
  const visiting = new Set();
  function resolve(id) {
    if (level.has(id)) return level.get(id);
    if (visiting.has(id)) return 0; // cycle guard -- see docstring above
    visiting.add(id);
    const broaderTargets = [...narrowerToBroader.get(id)];
    const result = broaderTargets.length ? 1 + Math.max(...broaderTargets.map(resolve)) : 0;
    visiting.delete(id);
    level.set(id, result);
    return result;
  }
  clusters.forEach(c => resolve(c.id));
  return level;
}

function boxLevels(clusters, edges, kind) {
  if (kind in HIERARCHY_BROADER_SIDE) return hierarchyLevels(clusters, edges, kind);
  return undirectedLevels(clusters, edges, DEPTH_CAPPED_KINDS.has(kind));
}

// ANTONYM has no inherent hierarchy -- a chain beyond one hop is
// coincidence (two different word pairs sharing a box), not a real
// multi-level structure, so its Cyclic view is capped at two columns
// (the hub's column and everything else's). Only applies to kinds not
// already handled by HIERARCHY_BROADER_SIDE above.
const DEPTH_CAPPED_KINDS = new Set(["ANTONYM"]);

// Reorders the boxes within each column to reduce edge crossings,
// leaving which column a box is in (set by boxLevels) untouched --
// only the vertical order within a column changes. Standard layered-
// graph crossing reduction (the barycenter/median heuristic Sugiyama-
// style layout tools use): repeatedly re-sort each column by the
// average vertical position, in the adjacent column, of the boxes it
// connects to, alternating left-to-right and right-to-left sweeps so
// influence propagates across more than just one column pair per pass.
// Doesn't guarantee zero crossings (that's NP-hard in general) but
// noticeably untangles the small graphs this view actually draws.
// Ties (no edge into the neighbouring column, or an identical average)
// keep the incoming order, so the very first pass's alphabetical
// ordering still acts as the deterministic tie-break it always did.
function reduceCrossings(byLevel, edges) {
  const adjacency = new Map();
  byLevel.forEach(list => list.forEach(c => adjacency.set(c.id, [])));
  edges.forEach(e => {
    if (e.sourceBox === e.targetBox) return;
    adjacency.get(e.sourceBox).push(e.targetBox);
    adjacency.get(e.targetBox).push(e.sourceBox);
  });

  const indexOf = (list) => new Map(list.map((c, i) => [c.id, i]));

  function reordered(list, neighbourIndex) {
    const scored = list.map((c, i) => {
      const positions = adjacency.get(c.id)
        .filter(nb => neighbourIndex.has(nb))
        .map(nb => neighbourIndex.get(nb));
      const score = positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : null;
      return { c, i, score };
    });
    scored.sort((a, b) => {
      if (a.score === null || b.score === null) return a.i - b.i;
      if (a.score !== b.score) return a.score - b.score;
      return a.i - b.i;
    });
    return scored.map(s => s.c);
  }

  const columns = byLevel.map(list => list.slice());
  const sweeps = 4;
  for (let pass = 0; pass < sweeps; pass++) {
    if (pass % 2 === 0) {
      for (let k = 1; k < columns.length; k++) columns[k] = reordered(columns[k], indexOf(columns[k - 1]));
    } else {
      for (let k = columns.length - 2; k >= 0; k--) columns[k] = reordered(columns[k], indexOf(columns[k + 1]));
    }
  }
  return columns;
}

function clusterGraphSVG(group, wordById, kind) {
  const lineHeight = 15;
  const boxDims = new Map();
  group.clusters.forEach(c => {
    const labels = c.wordIds.map(id => wordById.get(id).lexical_form);
    const width = Math.max(64, Math.max(...labels.map(l => l.length)) * 7.2 + 24);
    const height = c.wordIds.length * lineHeight + 14;
    boxDims.set(c.id, { width, height });
  });

  const level = boxLevels(group.clusters, group.edges, kind);
  const maxLevel = Math.max(...group.clusters.map(c => level.get(c.id)));
  const byLevel = [];
  for (let i = 0; i <= maxLevel; i++) byLevel.push([]);
  group.clusters.forEach(c => byLevel[level.get(c.id)].push(c));
  byLevel.forEach(list => list.sort((a, b) => wordById.get(a.wordIds[0]).lexical_form.localeCompare(wordById.get(b.wordIds[0]).lexical_form)));
  const orderedByLevel = reduceCrossings(byLevel, group.edges);

  const rowGap = 22;
  const marginX = 40, marginY = 30;
  const maxBoxWidth = Math.max(...group.clusters.map(c => boxDims.get(c.id).width));
  const columnStep = maxBoxWidth + 100;
  const colHeights = orderedByLevel.map(list => list.reduce((s, c) => s + boxDims.get(c.id).height, 0) + rowGap * Math.max(0, list.length - 1));
  const maxColHeight = Math.max(...colHeights);
  const width = marginX * 2 + maxBoxWidth + maxLevel * columnStep;
  const height = marginY * 2 + maxColHeight;

  const boxPos = new Map();
  const wordPos = new Map();
  orderedByLevel.forEach((list, lvl) => {
    let y = marginY + (maxColHeight - colHeights[lvl]) / 2;
    const x = marginX + maxBoxWidth / 2 + lvl * columnStep;
    list.forEach(c => {
      const d = boxDims.get(c.id);
      const pos = { x, y: y + d.height / 2 };
      boxPos.set(c.id, pos);
      c.wordIds.forEach((wid, idx) => {
        wordPos.set(wid, { x: pos.x, y: pos.y - d.height / 2 + 12 + idx * lineHeight });
      });
      y += d.height + rowGap;
    });
  });

  const edgeKeys = new Set(group.edges.map(r => \`\${r.source_id}|\${r.target_id}\`));
  const drawn = new Set();
  let linesHTML = "";
  group.edges.forEach(r => {
    const key = \`\${r.source_id}|\${r.target_id}\`;
    const revKey = \`\${r.target_id}|\${r.source_id}\`;
    if (drawn.has(key) || drawn.has(revKey)) return;
    drawn.add(key);
    const p1 = wordPos.get(r.source_id), p2 = wordPos.get(r.target_id);
    if (!p1 || !p2) return;
    const bidirectional = edgeKeys.has(revKey);
    linesHTML += \`<line x1="\${p1.x.toFixed(1)}" y1="\${p1.y.toFixed(1)}" x2="\${p2.x.toFixed(1)}" y2="\${p2.y.toFixed(1)}" class="cyclic-edge" marker-end="url(#cyclic-arrow)" \${bidirectional ? 'marker-start="url(#cyclic-arrow)"' : ''} />\`;
  });

  // Boxes drawn as a layer, word labels as the layer above -- so a
  // line's visible end sits right at the box edge (the box fill
  // occludes the segment inside it) while the label stays legible on top.
  let boxesHTML = "";
  let wordsHTML = "";
  group.clusters.forEach(c => {
    const pos = boxPos.get(c.id);
    const dims = boxDims.get(c.id);
    boxesHTML += \`<rect x="\${(pos.x - dims.width / 2).toFixed(1)}" y="\${(pos.y - dims.height / 2).toFixed(1)}" width="\${dims.width.toFixed(1)}" height="\${dims.height.toFixed(1)}" rx="6" class="cyclic-box" />\`;
    c.wordIds.forEach(wid => {
      const w = wordById.get(wid);
      const wp = wordPos.get(wid);
      const color = POS_COLORS[w.pos] || "#7A7A7A";
      // Highlights the shared selection's own node, if it's part of
      // this cluster graph -- selectWord()'s own docstring on why every
      // tab (including Cyclic) reflects the same selected word.
      const isSelected = wid === state.selectedWordId;
      wordsHTML += \`<g class="cyclic-node\${isSelected ? ' cyclic-node-selected' : ''}" data-pivot-id="\${wid}" tabindex="0" transform="translate(\${wp.x.toFixed(1)},\${wp.y.toFixed(1)})">\`
        + \`<circle r="4" fill="\${color}" cx="\${(-dims.width / 2 + 11).toFixed(1)}" />\`
        + \`<text x="\${(-dims.width / 2 + 19).toFixed(1)}" y="4" text-anchor="start">\${w.lexical_form}</text></g>\`;
    });
  });

  return \`<div class="cyclic-svg-wrap"><svg viewBox="0 0 \${width} \${height}" width="\${width}" height="\${height}" class="cyclic-graph">\`
    + \`<defs><marker id="cyclic-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\`
    + \`<path d="M0,0 L10,5 L0,10 z" class="cyclic-arrow" /></marker></defs>\`
    + \`\${linesHTML}\${boxesHTML}\${wordsHTML}</svg></div>\`;
}

// A generous safety cap, not a curation choice.
const MAX_CYCLIC_GROUPS_SHOWN = 400;

function renderCyclic() {
  const note = document.getElementById("cyclic-note");
  const container = document.getElementById("cyclic-clusters");
  if (!state.cyclicKind) {
    note.textContent = "No relationships in this Dictionary yet.";
    container.innerHTML = "";
    return;
  }
  if (OVER_CAPACITY) {
    // buildClusterGraphs() (below) reads WORDS/RELS directly, both []
    // past MAX_INTERACTIVE_WORDS -- unlike the Words/Relationships/
    // Hierarchy tabs, this view has no server-resolved counterpart yet
    // (it boxes every synonym-clustered word in the whole Dictionary,
    // then draws every cross-box edge of the chosen kind -- a
    // whole-graph analysis, not a single word's own neighbourhood, so
    // it doesn't reduce to a bounded per-word query the way Hierarchy's
    // own resolveHierarchy() does). An honest "not available" message,
    // not the misleading "No relationships" text a caller would see
    // otherwise (empty RELS reading as "this Dictionary has no data"
    // rather than "this view can't be built at this Domain's size").
    note.textContent = \`Cyclic isn't available for a Domain this large yet (\${TOTAL_RELATIONSHIP_COUNT.toLocaleString()} relationships) -- search the Relationships tab instead.\`;
    container.innerHTML = "";
    return;
  }
  const { groups, wordById } = buildClusterGraphs(state.cyclicKind);
  if (!groups.length) {
    note.textContent = \`No \${titleCase(state.cyclicKind).toLowerCase()} relationships connect any synonym-clustered words for this kind.\`;
    container.innerHTML = "";
    return;
  }

  // Scope to just the group(s) containing the shared selection, the
  // same way Hierarchy centres its own tree on it (buildHierarchy()'s
  // own docstring) -- without this, every tab keeps showing whichever
  // groups happen to sort largest regardless of what's selected, which
  // reads as "the selection is ignored" even though the selected node
  // IS highlighted wherever it happens to already be on screen
  // (clusterGraphSVG()'s own isSelected). A word with no edges of this
  // kind at all has no group to scope to -- shows an explicit message
  // rather than silently falling back to every unrelated group.
  let scopedGroups = groups;
  let centred = false;
  if (state.selectedWordId) {
    const matching = groups.filter(g => g.clusters.some(c => c.wordIds.includes(state.selectedWordId)));
    if (!matching.length) {
      const selWord = wordById.get(state.selectedWordId);
      note.innerHTML = \`No \${titleCase(state.cyclicKind).toLowerCase()} relationships connect <strong>\${selWord ? selWord.lexical_form : 'the selected word'}</strong> to any synonym-clustered word for this kind. \`
        + '<button type="button" class="link-btn" id="cyclic-reset">show every group</button>';
      document.getElementById("cyclic-reset").addEventListener("click", () => selectWord(null));
      container.innerHTML = "";
      return;
    }
    scopedGroups = matching;
    centred = true;
  }

  const shown = scopedGroups.slice(0, MAX_CYCLIC_GROUPS_SHOWN);
  const totalBoxes = scopedGroups.reduce((s, g) => s + g.clusters.length, 0);
  const totalWords = new Set(scopedGroups.flatMap(g => g.clusters.flatMap(c => c.wordIds))).size;
  const selWord = centred ? wordById.get(state.selectedWordId) : null;
  note.innerHTML = \`Synonyms boxed together, \${titleCase(state.cyclicKind).toLowerCase()} drawn between boxes: \`
    + \`\${scopedGroups.length} group\${scopedGroups.length === 1 ? '' : 's'} &middot; \${totalBoxes} boxes &middot; \${totalWords} words\`
    + (scopedGroups.length > shown.length ? \` -- showing the \${shown.length} largest\` : '') + '.'
    + (centred ? \` -- showing only the group\${scopedGroups.length === 1 ? '' : 's'} containing <strong>\${selWord ? selWord.lexical_form : 'the selected word'}</strong> &middot; <button type="button" class="link-btn" id="cyclic-reset">show every group</button>\` : '');
  container.innerHTML = shown.map(g => \`
    <div class="cyclic-cluster">
      <div class="cyclic-cluster-title">\${g.clusters.length} synonym boxes &middot; \${g.edges.length} \${titleCase(state.cyclicKind).toLowerCase()} edges</div>
      \${clusterGraphSVG(g, wordById, state.cyclicKind)}
    </div>\`).join('');
  const cyclicResetBtn = document.getElementById("cyclic-reset");
  if (cyclicResetBtn) cyclicResetBtn.addEventListener("click", () => selectWord(null));
  container.querySelectorAll(".cyclic-node[data-pivot-id]").forEach(node => {
    node.addEventListener("click", () => selectWord(node.dataset.pivotId));
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectWord(node.dataset.pivotId); }
    });
  });
}

// SYNONYM itself is excluded from this dropdown -- it's what defines
// the boxes (synonymBoxes), not a kind you'd pick to draw lines between
// them (every SYNONYM pair is, by definition, already inside one box
// together, so there'd never be a cross-box SYNONYM line to draw).
// Restricted to group 1 (Lexical Semantic -- ANTONYM, HYPERNYM/HYPONYM,
// MERONYM/HOLONYM, TROPONYM, ENTAILMENT, CAUSE, RELATED), not every
// kind in the Dictionary: this tab's whole premise -- box the synonyms,
// draw lines for what they mean in relation to other words -- is itself
// a Lexical Semantic idea (SYNONYM is group 1), so pairing it with a
// Morphological kind (PLURAL_FORM, LEMMA_FORM, ...) or an Orthographic
// one (CONTRACTION, ...) doesn't read as a meaningful combination -- and
// in practice a high-volume morphological kind like LEMMA_FORM (every
// inflected form has one) would otherwise win the "most edges" default
// and bury the whole page under a wall of a thousand-plus tiny boxes
// that doesn't illustrate what this view is for.
function populateCyclicKindFilter() {
  const select = document.getElementById("cyclic-kind");
  const counts = {};
  RELATIONSHIP_KIND_COUNTS.forEach(({ kind, group, count }) => { if (kind !== "SYNONYM" && group === 1) counts[kind] = count; });
  const kinds = Object.keys(counts).sort();
  appendKindOptions(select, counts);
  // Default to the first kind (by edge count) that actually connects
  // two or more synonym boxes, rather than whichever kind sorts first
  // alphabetically -- most kinds never do (a HYPERNYM edge, say, is far
  // more likely to land entirely within one existing synonym box, or on
  // a word with no synonyms at all, than to bridge two different ones).
  // RELATED is deliberately pushed to the back of that ordering even
  // though it usually has the most edges of any kind here -- it's this
  // whole relationship group's own "unspecified" catch-all (see
  // examples/physics_domain_relationships.py's module docstring:
  // "never as a default when a more specific kind would apply"), so
  // raw edge count alone would make it win the default almost every
  // time, which is exactly the outcome that convention exists to avoid.
  const byCount = [...kinds].sort((a, b) => {
    if (a === "RELATED") return 1;
    if (b === "RELATED") return -1;
    return counts[b] - counts[a];
  });
  const withGroups = byCount.find(kind => buildClusterGraphs(kind).groups.length > 0);
  state.cyclicKind = withGroups || kinds[0] || null;
  if (state.cyclicKind) select.value = state.cyclicKind;
}

// Same reasoning as MAX_WORD_ROWS_SHOWN above -- a generous safety cap
// on <tr> elements laid out at once, not a curation choice.
const MAX_REL_ROWS_SHOWN = 1000;

function relRowHtml(r) {
  return \`
    <tr>
      <td><span class="word-form">\${r.source_text}</span> \${r.source_pos ? posPill(r.source_pos) : ''}</td>
      <td>\${relPill(r.kind, r.group)}</td>
      <td><span class="word-form">\${r.target_text}</span> \${r.target_pos ? posPill(r.target_pos) : ''}</td>
      <td style="text-align:right" class="confidence">\${r.confidence.toFixed(4)}</td>
    </tr>\`;
}

let latestRelSearchRequestId = null;
let relSearchDebounceTimer = null;

function renderRels() {
  if (OVER_CAPACITY) {
    renderRelsOverCapacity();
    return;
  }
  let rows = filteredRels();
  const [key, dir] = state.sort.rels;
  rows = sortRows(rows, key, dir);
  const shown = rows.slice(0, MAX_REL_ROWS_SHOWN);
  const body = document.getElementById("rels-body");
  document.getElementById("rels-empty").style.display = rows.length ? "none" : "block";
  const note = document.getElementById("rels-note");
  if (rows.length > shown.length) {
    note.style.display = "block";
    note.textContent = \`Showing the first \${shown.length.toLocaleString()} of \${rows.length.toLocaleString()} matching relationships -- search to narrow.\`;
  } else {
    note.style.display = "none";
  }
  body.innerHTML = shown.map(relRowHtml).join('');
  document.getElementById("stat-rels").textContent = rows.length;
}

// The over-capacity counterpart to renderRels()'s own local-array path
// -- same "lira-search-words"/renderWordsOverCapacity() pattern
// (word_seeder.ts... rather, dictionary_view.ts's own renderWordsOverCapacity()
// docstring), a "lira-search-relationships" event instead. Reuses
// state.search.word as its query -- the Relationships tab has always
// filtered against that one search box (filteredRels()'s own body),
// never a separate relationship-specific one -- and now state.selectedWordId
// too, the shared selection every tab reads (selectWord()'s own
// docstring), scoping the results server-side (searchRelationships()'s
// own \`wordId\` option) the same way filteredRels() scopes them
// client-side under capacity.
function renderRelsOverCapacity() {
  if (relSearchDebounceTimer !== null) clearTimeout(relSearchDebounceTimer);
  relSearchDebounceTimer = setTimeout(() => {
    const requestId = 'rel-search-' + Math.random().toString(36).slice(2);
    latestRelSearchRequestId = requestId;
    document.getElementById("rels-note").style.display = "none";
    document.getElementById("rels-empty").style.display = "none";
    document.getElementById("rels-body").innerHTML =
      '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--ink-muted,#5B6660)">Searching…</td></tr>';
    document.dispatchEvent(new CustomEvent("lira-search-relationships", {
      detail: { requestId, wordId: state.selectedWordId || undefined, query: state.search.word, limit: MAX_REL_ROWS_SHOWN },
    }));
  }, WORD_SEARCH_DEBOUNCE_MS);
}

// Two independent callers share this one event: the Relationships tab's
// own renderRelsOverCapacity() (latestRelSearchRequestId) and the
// shared selection's own detail-panel relationship list
// (pendingDetailRelLookups, fetchDetailRelsIfNeeded()'s own docstring).
// requestId alone tells them apart -- each caller only ever recognises
// its own.
document.addEventListener("lira-search-relationships-result", (e) => {
  const { requestId, relationships, totalMatches } = e.detail;

  if (requestId === latestRelSearchRequestId) {
    const body = document.getElementById("rels-body");
    const empty = document.getElementById("rels-empty");
    const note = document.getElementById("rels-note");
    if (relationships.length === 0) {
      body.innerHTML = "";
      empty.style.display = "block";
      note.style.display = "none";
    } else {
      empty.style.display = "none";
      body.innerHTML = relationships.map(relRowHtml).join('');
      if (totalMatches > relationships.length) {
        note.style.display = "block";
        note.textContent = \`Showing the first \${relationships.length.toLocaleString()} of \${totalMatches.toLocaleString()} matching relationships -- narrow your search to see the rest.\`;
      } else {
        note.style.display = "none";
      }
    }
    document.getElementById("stat-rels").textContent = TOTAL_RELATIONSHIP_COUNT;
    return;
  }

  if (pendingDetailRelLookups.has(requestId)) {
    const wordId = pendingDetailRelLookups.get(requestId);
    pendingDetailRelLookups.delete(requestId);
    detailRelsInFlight.delete(wordId);
    const rels = relationships
      .map(r => {
        const outgoing = r.source_id === wordId;
        return {
          ...r, outgoing,
          otherId: outgoing ? r.target_id : r.source_id,
          otherText: outgoing ? r.target_text : r.source_text,
          otherDomain: outgoing ? r.target_domain : r.source_domain,
          otherSenseId: outgoing ? r.target_sense_id : r.source_sense_id,
          pillKind: displayKind(r.kind, outgoing),
        };
      })
      .sort((a, b) => (a.group - b.group) || a.kind.localeCompare(b.kind));
    detailRelsCache.set(wordId, rels);
    if (state.selectedWordId !== wordId) return;
    refreshHierarchyKindCounts();
    // Every detail panel currently showing this word gets the same
    // patch -- a full wordDetailHTML() re-render off the already-
    // resolved Word (no re-fetch, no re-resolve, same cheap "plain DOM
    // update" this used to be for the old flat relationships list), not
    // another renderDetailPanel() call. A narrow .detail-relationships-section
    // replace stopped being enough once relationships were also nested
    // per-sense (sensesSectionHTML()'s own docstring) -- each sense's
    // own count/list needs the same refresh the general section does,
    // so the whole panel body is rebuilt from the one already-known
    // Word instead.
    // totalMatches counts every candidate searchRelationships() returned
    // -- general AND sense-expanded together -- so it's not the right
    // number for the "Other Relationships" header any more (that's
    // scoped to general only now, generalRelationships()'s own
    // docstring); recount from the received rels themselves instead,
    // matching what that section actually goes on to show.
    const generalCount = generalRelationships(rels).length;
    ["words", "hierarchy", "cyclic"].forEach(panel => {
      const content = document.getElementById(\`detail-content-\${panel}\`);
      if (!content || content.style.display === "none") return;
      const panelWord = wordForDetailPanel(panel);
      if (!panelWord) return;
      content.innerHTML = wordDetailHTML(panelWord, rels, generalCount);
      wireDetailPivotButtons(content);
    });
  }
});

function renderUnresolved() {
  const panel = document.getElementById("unresolved-panel");
  if (!UNRESOLVED.length) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "block";
  document.getElementById("unresolved-list").innerHTML = UNRESOLVED
    .map(w => \`<span class="word-form">\${w}</span>\`).join('');
}

function renderAll() {
  renderWords();
  renderPhrases();
  renderSenses();
  renderRels();
  renderDetailPanel("words");
  renderDetailPanel("phrases");
  renderDetailPanel("senses");
  renderDetailPanel("hierarchy");
  renderDetailPanel("cyclic");
  renderUnresolved();
  refreshHierarchyKindCounts();
  renderHierarchy();
  renderCyclic();
}

function selectTab(tab) {
  state.tab = tab;
  document.getElementById("tab-words").setAttribute("aria-selected", tab === "words");
  document.getElementById("tab-phrases").setAttribute("aria-selected", tab === "phrases");
  document.getElementById("tab-senses").setAttribute("aria-selected", tab === "senses");
  document.getElementById("tab-rels").setAttribute("aria-selected", tab === "rels");
  document.getElementById("tab-hierarchy").setAttribute("aria-selected", tab === "hierarchy");
  document.getElementById("tab-cyclic").setAttribute("aria-selected", tab === "cyclic");
  document.getElementById("panel-words").classList.toggle("active", tab === "words");
  document.getElementById("panel-phrases").classList.toggle("active", tab === "phrases");
  document.getElementById("panel-senses").classList.toggle("active", tab === "senses");
  document.getElementById("panel-rels").classList.toggle("active", tab === "rels");
  document.getElementById("panel-hierarchy").classList.toggle("active", tab === "hierarchy");
  document.getElementById("panel-cyclic").classList.toggle("active", tab === "cyclic");
}

document.getElementById("tab-words").addEventListener("click", () => { selectTab("words"); });
document.getElementById("tab-phrases").addEventListener("click", () => { selectTab("phrases"); });
document.getElementById("tab-senses").addEventListener("click", () => { selectTab("senses"); });
document.getElementById("tab-rels").addEventListener("click", () => { selectTab("rels"); });
document.getElementById("tab-hierarchy").addEventListener("click", () => { selectTab("hierarchy"); });
document.getElementById("tab-cyclic").addEventListener("click", () => { selectTab("cyclic"); });

document.getElementById("hierarchy-kind").addEventListener("change", (e) => {
  state.hierarchyKind = e.target.value || null;
  // The shared selection is left as-is on a kind change, unlike an
  // earlier version of this handler that cleared it -- selectWord()'s
  // own docstring on why it's shared across every tab now: clearing it
  // here would also deselect the Words/Relationships/Cyclic tabs' own
  // view of the same word, just because the Hierarchy dropdown changed.
  // If the selected word doesn't exist in the new kind's own graph,
  // resolveHierarchy() already degrades gracefully (an empty tree with
  // an honest "No relationships of this kind yet" message, not a crash)
  // rather than needing a reset here to avoid one.
  renderHierarchy();
});

document.getElementById("cyclic-kind").addEventListener("change", (e) => {
  state.cyclicKind = e.target.value || null;
  renderCyclic();
});

document.getElementById("search-word").addEventListener("input", (e) => {
  state.search.word = e.target.value;
  renderAll();
});

document.getElementById("search-gloss").addEventListener("input", (e) => {
  state.search.gloss = e.target.value;
  renderAll();
});

document.getElementById("search-definition").addEventListener("input", (e) => {
  state.search.definition = e.target.value;
  renderAll();
});

document.getElementById("pos-filter").addEventListener("change", (e) => {
  state.pos = e.target.value;
  renderWords();
  renderPhrases();
  renderSenses();
});

document.getElementById("domain-filter").addEventListener("change", (e) => {
  state.domain = e.target.value;
  renderWords();
});

document.getElementById("root-word-filter").addEventListener("change", (e) => {
  state.rootWordsOnly = e.target.checked;
  renderWords();
  renderSenses();
});

document.getElementById("words-body").addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-word-id]");
  if (row) selectWord(row.dataset.wordId);
});

document.getElementById("phrases-body").addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-word-id]");
  if (row) selectWord(row.dataset.wordId);
});

document.getElementById("senses-body").addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-word-id]");
  if (row) selectWord(row.dataset.wordId);
});

document.querySelectorAll("#panel-words thead th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    const [curKey, curDir] = state.sort.words;
    state.sort.words = [key, curKey === key ? -curDir : 1];
    renderWords();
  });
});

document.querySelectorAll("#panel-rels thead th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    const [curKey, curDir] = state.sort.rels;
    state.sort.rels = [key, curKey === key ? -curDir : 1];
    renderRels();
  });
});

populatePosFilter();
populateDomainFilter();
populateHierarchyKindFilter();
populateCyclicKindFilter();
renderAll();

// Additive external hook (knowledge/ui/knowledge_view.py) -- lets a
// combined page embedding this fragment as its own "Vocabulary" tab
// pivot straight to one word's detail panel from outside this script's
// own IIFE scope, the same way selectTab/selectWord do it internally.
// window-scoped since render_fragment()'s IIFE wrapping (module
// docstring) otherwise hides every name here from a sibling script.
// Returns false (a no-op) rather than throwing when wordId isn't in
// WORDS -- a Concept the caller holds may have no Word behind it at all
// (e.g. a reified "is-a"/"causes" verb Concept, knowledge/role/dictionary_seeder.py).
// Existing call sites (every current DictionaryView.save()/render()
// caller) are unaffected -- this only adds a global, it changes no
// existing behaviour.
window.liraDictionaryGoToWord = function (wordId) {
  if (!WORDS.some(w => w.id === wordId)) return false;
  selectTab("words");
  selectWord(wordId);
  return true;
};
/*@@SCRIPT_FRAGMENT_END@@*/
</script>
</body>
</html>
`;
