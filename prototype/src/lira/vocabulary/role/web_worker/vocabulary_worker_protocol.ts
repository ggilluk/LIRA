/** Message protocol between the main thread (VocabularyWorkerClient) and
 * the Vocabulary Service worker (vocabulary_worker.ts) -- shared here so
 * both sides are typed against the same shapes instead of each guessing
 * at the other's message format. */

import type { HierarchyEdge, HierarchyNode } from "../../ui/server/builder_hierarchy";
import type { LexicalRelationshipRecord } from "../../ui/server/builder_lexical_relationship";
import type { PhraseRecord } from "../../ui/server/builder_phrase";
import type { RelationshipRecord } from "../../ui/server/builder_relationship";
import type { SenseRecord } from "../../ui/server/builder_sense";
import type { WordRecord } from "../../ui/server/builder_word";

/** The Vocabulary Service's own status vocabulary -- deliberately not
 * knowledge/data/service_status.ts's `ServiceState` (which also has
 * `"not-ported"`, a state only the UI ever assigns to a layer with no
 * worker at all): Vocabulary must not depend on Knowledge. The Portal
 * shell maps this onto its own `ServiceState` when it forwards a
 * status message to its ServiceStatusBoard. */
export type VocabularyServiceState = "idle" | "running" | "done" | "error";

/** One seeded Domain, as summarised for whichever UI is watching this
 * worker -- name, optional parent (for tree nesting), and the counts a
 * tree row displays. Deliberately not knowledge/data/portal_domain.ts's
 * `PortalDomain` type itself: that type belongs to the Knowledge Layer's
 * Portal shell, and this module must not import from Knowledge. */
export interface VocabularyDomainSummary {
  name: string;
  parentName?: string;
  wordCount: number;
  relationshipCount: number;
}

export interface InitRequest {
  type: "init";
}

export interface RenderRequest {
  type: "render";
  requestId: string;
  domain: string;
}

/** Triggers WordSeeder.seedWordNet (role/word_seeder.ts) on demand
 * against the named Domain's own VocabularyContext -- an on-demand
 * seeding pass, never implied by "init" (vocabulary_worker.ts's own
 * handleInit registers every Domain empty and seeds nothing at all;
 * SeedCommonVocabularyRequest below is the other on-demand seeding
 * pass, for the Common Vocabulary Cache's own closed/open-class words
 * rather than WordNet's). `domain` is a real target, not always
 * "Common", but the worker's own PortalShell caller (portal_shell.ts)
 * only ever asks for "Common" -- WordNet is a general-English lexical
 * resource, not a Domain-specific fact, and Physics's own Dictionary is
 * a one-time snapshot copy taken the first time Common is seeded
 * (VocabularyContext.seedFrom, vocabulary_worker.ts's own
 * handleSeedCommonVocabulary), so seeding a child Domain directly here
 * wouldn't do anything a Common seed doesn't already cover for it going
 * forward, while seeding Common retroactively into an already-copied
 * child would need its own separate propagation this protocol doesn't
 * attempt. */
export interface SeedWordNetRequest {
  type: "seed-wordnet";
  domain: string;
}

/** Triggers WordSeeder.seedDomain (seedClosedClassWords) plus
 * RelationshipSeeder.seedDomain on demand against the named Domain --
 * the Common Vocabulary Cache's own seed files (word-file/relationship-
 * file JSON, asset_loader.ts), as opposed to SeedWordNetRequest's
 * Princeton WordNet dict/ text. Used to be implied by "init" itself
 * (every session paid for seeding it, whether or not the Vocabulary UI
 * was ever opened); now both this and WordNet are on-demand actions a
 * user reaches for from the Vocabulary tab's own toolbar
 * (portal_shell.ts's own renderVocabToolbar()), side by side. The
 * first successful run against "Common" also refreshes Physics's own
 * one-time Dictionary snapshot (VocabularyContext.seedFrom) -- see
 * handleSeedCommonVocabulary's own docstring. */
export interface SeedCommonVocabularyRequest {
  type: "seed-common-vocabulary";
  domain: string;
}

/** Resolves one Words-tab search against `domain`'s full Dictionary,
 * server-side (DictionaryView.searchWords() -- that method's own
 * docstring on why: past MAX_INTERACTIVE_WORDS, there's no embedded
 * client-side WORDS array left to filter in the browser at all). Field
 * names/semantics mirror DictionaryView.searchWords()'s own options
 * directly -- this request is just that call, addressed across the
 * Worker boundary. */
export interface SearchWordsRequest {
  type: "search-words";
  requestId: string;
  domain: string;
  // Bypasses every field below for an O(1) exact lookup
  // (DictionaryView.searchWords()'s own docstring on why -- resolving a
  // related word clicked from inside the detail panel itself). Set on
  // its own, never combined with the filters below.
  wordId?: string;
  word?: string;
  gloss?: string;
  definition?: string;
  pos?: string;
  domainLabel?: string;
  rootWordsOnly?: boolean;
  limit?: number;
}

/** Resolves one Phrases-tab search against `domain`'s full Phrases,
 * server-side (DictionaryView.searchPhrases() -- that method's own
 * docstring on why: past MAX_INTERACTIVE_WORDS_PHRASES, there's no
 * embedded client-side PHRASES array left to filter in the browser at
 * all). Field names/semantics mirror DictionaryView.searchPhrases()'s
 * own options directly -- SearchWordsRequest's own exact counterpart,
 * minus `wordId`/`domainLabel`/`rootWordsOnly` (a Phrase pivot-lookup
 * still goes through the shared SearchWordsRequest/`wordId` path,
 * DictionaryView.searchWords()'s own Phrases fallback -- there's
 * nothing Phrase-specific for a second `wordId` mode to do here -- and
 * Phrase has neither a domain nor an is-root-word field of its own). */
export interface SearchPhrasesRequest {
  type: "search-phrases";
  requestId: string;
  domain: string;
  word?: string;
  gloss?: string;
  definition?: string;
  pos?: string;
  limit?: number;
}

/** SearchPhrasesRequest's own exact counterpart for the Senses tab
 * (DictionaryView.searchSenses() -- past MAX_INTERACTIVE_WORDS, there's
 * no embedded client-side SENSES array left to filter in the browser
 * at all). A Sense-uuid pivot lookup (a Senses-tab row click) still
 * goes through the shared SearchWordsRequest/`wordId` path, same as a
 * Phrase's own -- DictionaryView.searchWords()'s own Senses fallback. */
export interface SearchSensesRequest {
  type: "search-senses";
  requestId: string;
  domain: string;
  word?: string;
  gloss?: string;
  definition?: string;
  pos?: string;
  limit?: number;
}

/** Resolves one Relationships-tab search, or (given `wordId`) "every
 * relationship touching this one Word" -- the Words-tab detail panel's
 * own need, over MAX_INTERACTIVE_WORDS -- against `domain`'s full
 * LexicalRelationshipStore, server-side (DictionaryView.searchRelationships(),
 * that method's own docstring on the `wordId` fast path). */
export interface SearchRelationshipsRequest {
  type: "search-relationships";
  requestId: string;
  domain: string;
  wordId?: string;
  query?: string;
  limit?: number;
}

/** SearchRelationshipsRequest's own exact counterpart against `domain`'s
 * full LexicalRelationshipStore (data/lexical_relationship.ts) instead
 * of its SemanticRelationshipStore -- the Word Detail UI's own
 * "Sense.Lexical.Relationships" section (client_senses_section_html.ts),
 * fetched server-side over MAX_INTERACTIVE_WORDS the identical way. */
export interface SearchLexicalRelationshipsRequest {
  type: "search-lexical-relationships";
  requestId: string;
  domain: string;
  wordId?: string;
  query?: string;
  limit?: number;
}

/** Resolves one Hierarchy-tab tree against `domain`'s full
 * LexicalRelationshipStore, server-side (DictionaryView.resolveHierarchy(),
 * that method's own docstring on the two modes `wordId` selects
 * between, and on `limit`'s own default). The Hierarchy tab's
 * counterpart to SearchRelationshipsRequest -- same reasoning, past
 * MAX_INTERACTIVE_WORDS there's no client-embedded RELS array left to
 * build a tree from in the browser at all. */
export interface ResolveHierarchyRequest {
  type: "resolve-hierarchy";
  requestId: string;
  domain: string;
  kind: string;
  wordId?: string;
  limit?: number;
}

export type VocabularyWorkerRequest =
  | InitRequest
  | RenderRequest
  | SeedWordNetRequest
  | SeedCommonVocabularyRequest
  | SearchWordsRequest
  | SearchPhrasesRequest
  | SearchSensesRequest
  | SearchRelationshipsRequest
  | SearchLexicalRelationshipsRequest
  | ResolveHierarchyRequest;

export interface StatusMessage {
  type: "status";
  state: VocabularyServiceState;
  detail?: string;
  // Fraction in [0, 1] for a run with a known length (seedWordNet's own
  // (processed, total) synset count) -- undefined means either no
  // progress-bearing work is in flight, or its length isn't known yet,
  // never "0%"; a listener should treat undefined as "no bar to show",
  // not "just started".
  progress?: number;
}

export interface ReadyMessage {
  type: "ready";
  domains: readonly VocabularyDomainSummary[];
}

/** Posted once a seed-wordnet request finishes -- the target Domain's
 * refreshed summary (wordCount/relationshipCount now reflecting the
 * newly-seeded WordNet Words/SYNONYM relationships), so whichever UI
 * asked for the seed can update its own copy of that Domain's counts
 * (e.g. PortalDomainRegistry's tree row) without re-requesting "ready"
 * for every Domain. */
export interface DomainUpdatedMessage {
  type: "domain-updated";
  domain: VocabularyDomainSummary;
}

/** A rendered Domain's DictionaryView, as its three renderFragment()
 * pieces -- style/body/script -- rather than one self-contained HTML
 * string. The Portal shell mounts these directly into its own DOM
 * (matching the Python `LiraView` combiner's pattern) instead of an
 * `<iframe srcdoc>`, so the fragment inherits the shell's own width,
 * fonts, and theme tokens instead of laying out for a full-page
 * viewport -- and so DictionaryView's own masthead/title, which
 * renderFragment() excludes by design, never duplicates the Portal
 * topbar's breadcrumb. */
export interface RenderedFragment {
  style: string;
  body: string;
  script: string;
}

export interface RenderedMessage {
  type: "rendered";
  requestId: string;
  domain: string;
  fragment: RenderedFragment;
}

/** Posted instead of RenderedMessage when a render request fails --
 * an unknown Domain name, or DictionaryView.renderFragment() itself
 * throwing (dictionary_view.ts's own MAX_INTERACTIVE_WORDS docstring).
 * Carries the same `requestId` a RenderedMessage would have, so
 * VocabularyWorkerClient.renderDomain()'s matching pending Promise can
 * reject instead of hanging forever -- the failure mode before this
 * message type existed. */
export interface RenderErrorMessage {
  type: "render-error";
  requestId: string;
  message: string;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

/** The response to a SearchWordsRequest -- `words` capped at the
 * request's own `limit` (DictionaryView.searchWords()'s own docstring),
 * `totalMatches` the true, uncapped count, so a caller can show
 * "showing N of totalMatches" the same way MAX_WORD_ROWS_SHOWN's
 * client-side note already does for the under-capacity case. Always
 * posted, even for zero matches or an unknown Domain (words: [],
 * totalMatches: 0) -- never left unanswered the way a render failure
 * used to before RenderErrorMessage existed. */
export interface SearchWordsResultMessage {
  type: "search-words-result";
  requestId: string;
  words: readonly WordRecord[];
  totalMatches: number;
}

/** The response to a SearchPhrasesRequest -- same capped-`phrases`/
 * true-`totalMatches` shape as SearchWordsResultMessage, for the same
 * reason. */
export interface SearchPhrasesResultMessage {
  type: "search-phrases-result";
  requestId: string;
  phrases: readonly PhraseRecord[];
  totalMatches: number;
}

/** The response to a SearchSensesRequest -- same capped-`senses`/
 * true-`totalMatches` shape as SearchPhrasesResultMessage, for the same
 * reason. */
export interface SearchSensesResultMessage {
  type: "search-senses-result";
  requestId: string;
  senses: readonly SenseRecord[];
  totalMatches: number;
}

/** The response to a SearchRelationshipsRequest -- same
 * capped-`relationships`/true-`totalMatches` shape as
 * SearchWordsResultMessage, for the same reason. */
export interface SearchRelationshipsResultMessage {
  type: "search-relationships-result";
  requestId: string;
  relationships: readonly RelationshipRecord[];
  totalMatches: number;
}

/** The response to a SearchLexicalRelationshipsRequest -- same
 * capped-`relationships`/true-`totalMatches` shape as
 * SearchRelationshipsResultMessage, for the same reason. */
export interface SearchLexicalRelationshipsResultMessage {
  type: "search-lexical-relationships-result";
  requestId: string;
  relationships: readonly LexicalRelationshipRecord[];
  totalMatches: number;
}

/** The response to a ResolveHierarchyRequest -- DictionaryView.resolveHierarchy()'s
 * own return shape, carried across the Worker boundary unchanged. */
export interface ResolveHierarchyResultMessage {
  type: "resolve-hierarchy-result";
  requestId: string;
  nodes: readonly HierarchyNode[];
  edges: readonly HierarchyEdge[];
  roots: readonly string[];
  totalEdgeCount: number;
  totalNodeCount: number;
  fellBack: boolean;
  truncated: boolean;
}

export type VocabularyWorkerMessage =
  | StatusMessage
  | ReadyMessage
  | RenderedMessage
  | RenderErrorMessage
  | ErrorMessage
  | DomainUpdatedMessage
  | SearchWordsResultMessage
  | SearchPhrasesResultMessage
  | SearchSensesResultMessage
  | SearchRelationshipsResultMessage
  | SearchLexicalRelationshipsResultMessage
  | ResolveHierarchyResultMessage;
