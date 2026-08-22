import type {
  RenderedFragment,
  VocabularyDomainSummary,
  VocabularyServiceState,
  VocabularyWorkerMessage,
  VocabularyWorkerRequest,
} from "./vocabulary_worker_protocol";
import type { HierarchyEdge, HierarchyNode } from "../../ui/server/builder_hierarchy";
import type { LexicalRelationshipRecord } from "../../ui/server/builder_lexical_relationship";
import type { PhraseRecord } from "../../ui/server/builder_phrase";
import type { RelationshipRecord } from "../../ui/server/builder_relationship";
import type { SenseRecord } from "../../ui/server/builder_sense";
import type { WordRecord } from "../../ui/server/builder_word";

export interface WordSearchQuery {
  wordId?: string;
  word?: string;
  gloss?: string;
  definition?: string;
  pos?: string;
  domainLabel?: string;
  rootWordsOnly?: boolean;
  limit?: number;
}

export interface WordSearchResult {
  words: readonly WordRecord[];
  totalMatches: number;
}

export interface PhraseSearchQuery {
  word?: string;
  gloss?: string;
  definition?: string;
  pos?: string;
  limit?: number;
}

export interface PhraseSearchResult {
  phrases: readonly PhraseRecord[];
  totalMatches: number;
}

export interface SenseSearchQuery {
  word?: string;
  gloss?: string;
  definition?: string;
  pos?: string;
  limit?: number;
}

export interface SenseSearchResult {
  senses: readonly SenseRecord[];
  totalMatches: number;
}

export interface RelationshipSearchQuery {
  wordId?: string;
  query?: string;
  limit?: number;
}

export interface RelationshipSearchResult {
  relationships: readonly RelationshipRecord[];
  totalMatches: number;
}

export interface LexicalRelationshipSearchQuery {
  wordId?: string;
  query?: string;
  limit?: number;
}

export interface LexicalRelationshipSearchResult {
  relationships: readonly LexicalRelationshipRecord[];
  totalMatches: number;
}

export interface HierarchyQuery {
  kind: string;
  wordId?: string;
  limit?: number;
}

export interface HierarchyResult {
  nodes: readonly HierarchyNode[];
  edges: readonly HierarchyEdge[];
  roots: readonly string[];
  totalEdgeCount: number;
  totalNodeCount: number;
  fellBack: boolean;
  truncated: boolean;
}

export type VocabularyStatusListener = (state: VocabularyServiceState, detail?: string, progress?: number) => void;
export type VocabularyDomainUpdateListener = (domain: VocabularyDomainSummary) => void;

/** Main-thread handle to the Vocabulary Service worker
 * (vocabulary_worker.ts) -- starts the worker, turns its postMessage
 * protocol into promise-based calls (`init()`, `renderDomain()`,
 * `searchWords()`) plus one fire-and-forget call (`seedWordNet()`), and
 * fans its status
 * messages out to any number of listeners (the LoadingScreen during
 * startup, the persistent ServiceStatusView afterwards -- both just
 * call `onStatus`, neither knows about the other). One client owns
 * exactly one worker; the Portal shell is built around a single
 * Vocabulary Service instance. */
export class VocabularyWorkerClient {
  private readonly worker: Worker;
  private readonly statusListeners = new Set<VocabularyStatusListener>();
  private readonly domainUpdateListeners = new Set<VocabularyDomainUpdateListener>();
  private readyResolvers: Array<(domains: readonly VocabularyDomainSummary[]) => void> = [];
  private readonly pendingRenders = new Map<string, { resolve: (fragment: RenderedFragment) => void; reject: (error: Error) => void }>();
  private readonly pendingSearches = new Map<string, (result: WordSearchResult) => void>();
  private readonly pendingPhraseSearches = new Map<string, (result: PhraseSearchResult) => void>();
  private readonly pendingSenseSearches = new Map<string, (result: SenseSearchResult) => void>();
  private readonly pendingRelationshipSearches = new Map<string, (result: RelationshipSearchResult) => void>();
  private readonly pendingLexicalRelationshipSearches = new Map<string, (result: LexicalRelationshipSearchResult) => void>();
  private readonly pendingHierarchyResolutions = new Map<string, (result: HierarchyResult) => void>();

  constructor() {
    this.worker = new Worker(new URL("./vocabulary_worker.ts", import.meta.url), { type: "module" });
    this.worker.addEventListener("message", (event: MessageEvent<VocabularyWorkerMessage>) => {
      this.handleMessage(event.data);
    });
  }

  /** Subscribes to every status update the Service reports (loading
   * stages during init, "done" once ready, "error" on failure). Returns
   * an unsubscribe function. */
  onStatus(listener: VocabularyStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /** Starts seeding inside the worker; resolves with a summary of every
   * seeded Domain once ready. Status updates arrive via `onStatus`
   * throughout, not just at the end. */
  init(): Promise<readonly VocabularyDomainSummary[]> {
    return new Promise((resolve) => {
      this.readyResolvers.push(resolve);
      this.post({ type: "init" });
    });
  }

  /** Renders one Domain's DictionaryView inside the worker (cached
   * there after the first call for that Domain) and resolves with its
   * three renderFragment() pieces -- style/body/script -- for the
   * Portal shell to mount directly into its own DOM. Rejects on a
   * RenderErrorMessage (e.g. an unknown Domain name) rather than
   * hanging forever -- that message type's own docstring
   * (vocabulary_worker_protocol.ts) on the failure mode this replaced. */
  renderDomain(name: string): Promise<RenderedFragment> {
    const requestId = `${name}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      this.pendingRenders.set(requestId, { resolve, reject });
      this.post({ type: "render", requestId, domain: name });
    });
  }

  /** Fires an on-demand WordSeeder.seedWordNet pass inside the worker
   * against the named Domain (SeedWordNetRequest's own docstring on why
   * this is always "Common" in practice). Fire-and-forget by design --
   * progress and completion both surface through `onStatus` (state
   * "running" with a growing `progress` fraction throughout, then
   * "done") and `onDomainUpdated` (once, with the Domain's refreshed
   * counts), the same channels every other Vocabulary Service activity
   * already reports through, rather than a second parallel promise-based
   * API only this one call would use. */
  seedWordNet(domainName: string): void {
    this.post({ type: "seed-wordnet", domain: domainName });
  }

  /** Fires an on-demand Common Vocabulary Cache seed pass inside the
   * worker against the named Domain (SeedCommonVocabularyRequest's own
   * docstring) -- the seed-files counterpart to seedWordNet() above,
   * same fire-and-forget shape and the same `onStatus`/`onDomainUpdated`
   * reporting channels. */
  seedCommonVocabulary(domainName: string): void {
    this.post({ type: "seed-common-vocabulary", domain: domainName });
  }

  /** Subscribes to every DomainUpdatedMessage the Service posts (today,
   * after a seedWordNet or seedCommonVocabulary run finishes -- the
   * latter posts one for Physics too, the first time it bootstraps its
   * own snapshot copy of Common, handleSeedCommonVocabulary's own
   * docstring). Returns an unsubscribe function. */
  onDomainUpdated(listener: VocabularyDomainUpdateListener): () => void {
    this.domainUpdateListeners.add(listener);
    return () => {
      this.domainUpdateListeners.delete(listener);
    };
  }

  /** Resolves one Words-tab search against `domainName`'s Dictionary
   * inside the worker (DictionaryView.searchWords()'s own docstring) --
   * the on-demand counterpart to renderDomain() for a Domain over
   * MAX_INTERACTIVE_WORDS, where there's no client-embedded word list
   * to search locally. PortalShell's own DOM-event bridge is what
   * actually calls this -- the DictionaryView fragment's script has no
   * reference to this client, only a "lira-search-words" event it
   * dispatches (dictionary_view.ts's own renderWordsOverCapacity()). */
  searchWords(domainName: string, query: WordSearchQuery): Promise<WordSearchResult> {
    const requestId = `search-${domainName}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      this.pendingSearches.set(requestId, resolve);
      this.post({
        type: "search-words",
        requestId,
        domain: domainName,
        wordId: query.wordId,
        word: query.word,
        gloss: query.gloss,
        definition: query.definition,
        pos: query.pos,
        domainLabel: query.domainLabel,
        rootWordsOnly: query.rootWordsOnly,
        limit: query.limit,
      });
    });
  }

  /** searchWords()'s own exact counterpart for the Phrases tab, against
   * `domainName`'s Phrases inside the worker
   * (DictionaryView.searchPhrases()'s own docstring) -- PortalShell's
   * own DOM-event bridge answers a "lira-search-phrases" event the
   * fragment's script dispatches (dictionary_view.ts's own
   * renderPhrasesOverCapacity()). */
  searchPhrases(domainName: string, query: PhraseSearchQuery): Promise<PhraseSearchResult> {
    const requestId = `phrase-search-${domainName}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      this.pendingPhraseSearches.set(requestId, resolve);
      this.post({
        type: "search-phrases",
        requestId,
        domain: domainName,
        word: query.word,
        gloss: query.gloss,
        definition: query.definition,
        pos: query.pos,
        limit: query.limit,
      });
    });
  }

  /** searchPhrases()'s own exact counterpart for the Senses tab, against
   * `domainName`'s Senses store inside the worker
   * (DictionaryView.searchSenses()'s own docstring) -- PortalShell's
   * own DOM-event bridge answers a "lira-search-senses" event the
   * fragment's script dispatches (dictionary_view.ts's own
   * renderSensesOverCapacity()). */
  searchSenses(domainName: string, query: SenseSearchQuery): Promise<SenseSearchResult> {
    const requestId = `sense-search-${domainName}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      this.pendingSenseSearches.set(requestId, resolve);
      this.post({
        type: "search-senses",
        requestId,
        domain: domainName,
        word: query.word,
        gloss: query.gloss,
        definition: query.definition,
        pos: query.pos,
        limit: query.limit,
      });
    });
  }

  /** Resolves one Relationships-tab search, or (given `query.wordId`)
   * "every relationship touching this one Word" -- the Words-tab detail
   * panel's own need over MAX_INTERACTIVE_WORDS -- against `domainName`'s
   * LexicalRelationshipStore inside the worker
   * (DictionaryView.searchRelationships()'s own docstring). Same
   * DOM-event bridge as searchWords() -- PortalShell answers a
   * "lira-search-relationships" event the fragment's script dispatches
   * (dictionary_view.ts's own renderRelsOverCapacity()/renderDetailPanel()). */
  searchRelationships(domainName: string, query: RelationshipSearchQuery): Promise<RelationshipSearchResult> {
    const requestId = `rel-search-${domainName}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      this.pendingRelationshipSearches.set(requestId, resolve);
      this.post({
        type: "search-relationships",
        requestId,
        domain: domainName,
        wordId: query.wordId,
        query: query.query,
        limit: query.limit,
      });
    });
  }

  /** searchRelationships()'s own exact counterpart against
   * `domainName`'s LexicalRelationshipStore inside the worker
   * (DictionaryView.searchLexicalRelationships()'s own docstring) --
   * the Word Detail UI's own "Sense.Lexical.Relationships" section
   * (client_senses_section_html.ts), fetched over MAX_INTERACTIVE_WORDS
   * the same way. PortalShell answers a "lira-search-lexical-relationships"
   * event the fragment's script dispatches
   * (fetchDetailLexicalRelsIfNeeded(), client_detail_panel_controller.ts). */
  searchLexicalRelationships(domainName: string, query: LexicalRelationshipSearchQuery): Promise<LexicalRelationshipSearchResult> {
    const requestId = `lexical-rel-search-${domainName}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      this.pendingLexicalRelationshipSearches.set(requestId, resolve);
      this.post({
        type: "search-lexical-relationships",
        requestId,
        domain: domainName,
        wordId: query.wordId,
        query: query.query,
        limit: query.limit,
      });
    });
  }

  /** Resolves one Hierarchy-tab tree against `domainName`'s full
   * LexicalRelationshipStore inside the worker
   * (DictionaryView.resolveHierarchy()'s own docstring on the two modes
   * `query.wordId` selects between). Same DOM-event bridge pattern as
   * searchWords()/searchRelationships() -- PortalShell answers a
   * "lira-resolve-hierarchy" event the fragment's script dispatches
   * (dictionary_view.ts's own renderHierarchy()). */
  resolveHierarchy(domainName: string, query: HierarchyQuery): Promise<HierarchyResult> {
    const requestId = `hierarchy-${domainName}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      this.pendingHierarchyResolutions.set(requestId, resolve);
      this.post({
        type: "resolve-hierarchy",
        requestId,
        domain: domainName,
        kind: query.kind,
        wordId: query.wordId,
        limit: query.limit,
      });
    });
  }

  private post(request: VocabularyWorkerRequest): void {
    this.worker.postMessage(request);
  }

  private handleMessage(message: VocabularyWorkerMessage): void {
    if (message.type === "status") {
      for (const listener of this.statusListeners) listener(message.state, message.detail, message.progress);
    } else if (message.type === "ready") {
      const resolvers = this.readyResolvers.splice(0);
      for (const resolve of resolvers) resolve(message.domains);
    } else if (message.type === "rendered") {
      const pending = this.pendingRenders.get(message.requestId);
      if (pending) {
        this.pendingRenders.delete(message.requestId);
        pending.resolve(message.fragment);
      }
    } else if (message.type === "render-error") {
      const pending = this.pendingRenders.get(message.requestId);
      if (pending) {
        this.pendingRenders.delete(message.requestId);
        pending.reject(new Error(message.message));
      }
    } else if (message.type === "domain-updated") {
      for (const listener of this.domainUpdateListeners) listener(message.domain);
    } else if (message.type === "search-words-result") {
      const resolve = this.pendingSearches.get(message.requestId);
      if (resolve) {
        this.pendingSearches.delete(message.requestId);
        resolve({ words: message.words, totalMatches: message.totalMatches });
      }
    } else if (message.type === "search-phrases-result") {
      const resolve = this.pendingPhraseSearches.get(message.requestId);
      if (resolve) {
        this.pendingPhraseSearches.delete(message.requestId);
        resolve({ phrases: message.phrases, totalMatches: message.totalMatches });
      }
    } else if (message.type === "search-senses-result") {
      const resolve = this.pendingSenseSearches.get(message.requestId);
      if (resolve) {
        this.pendingSenseSearches.delete(message.requestId);
        resolve({ senses: message.senses, totalMatches: message.totalMatches });
      }
    } else if (message.type === "search-relationships-result") {
      const resolve = this.pendingRelationshipSearches.get(message.requestId);
      if (resolve) {
        this.pendingRelationshipSearches.delete(message.requestId);
        resolve({ relationships: message.relationships, totalMatches: message.totalMatches });
      }
    } else if (message.type === "search-lexical-relationships-result") {
      const resolve = this.pendingLexicalRelationshipSearches.get(message.requestId);
      if (resolve) {
        this.pendingLexicalRelationshipSearches.delete(message.requestId);
        resolve({ relationships: message.relationships, totalMatches: message.totalMatches });
      }
    } else if (message.type === "resolve-hierarchy-result") {
      const resolve = this.pendingHierarchyResolutions.get(message.requestId);
      if (resolve) {
        this.pendingHierarchyResolutions.delete(message.requestId);
        resolve({
          nodes: message.nodes,
          edges: message.edges,
          roots: message.roots,
          totalEdgeCount: message.totalEdgeCount,
          totalNodeCount: message.totalNodeCount,
          fellBack: message.fellBack,
          truncated: message.truncated,
        });
      }
    } else if (message.type === "error") {
      console.error("Vocabulary Service error:", message.message);
    }
  }
}
