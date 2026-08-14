/** The Vocabulary Service: runs WordSeeder, RelationshipSeeder, and
 * DictionaryView off the main thread, inside a real browser Web Worker
 * -- the browser-tab stand-in for a server-side Vocabulary process.
 * Nothing in here touches the DOM (WordSeeder/RelationshipSeeder/
 * Dictionary/DictionaryView are all pure data/string logic, same as the
 * Python originals), so the whole pipeline runs unmodified in a worker;
 * only the rendered HTML strings and status messages cross back to the
 * main thread via postMessage (VocabularyWorkerClient, the main-thread
 * side of this same protocol).
 *
 * This worker is deliberately the entire content of a Vite worker entry
 * (`new Worker(new URL("./vocabulary_worker.ts", import.meta.url), { type:
 * "module" })` in vocabulary_worker_client.ts) -- everything it imports
 * (WordSeeder, RelationshipSeeder, VocabularyLayer, DictionaryView, and
 * the ~5MB bundled Common Vocabulary Cache JSON they read) bundles into
 * this worker's own chunk, not the main thread's, so the page that
 * mounts the Portal shell stays light while this chunk loads and runs
 * in parallel. handleSeedWordNet's own ~21MB Princeton WordNet dict/
 * text is deliberately NOT part of that always-loaded chunk -- it's
 * fetched as its own lazy `import()` only once a "seed-wordnet" request
 * actually arrives (wordnet_loader.ts's own docstring), so a session
 * that never triggers it never pays for it. */

import { DictionaryView } from "../ui/dictionary_view";
import { VocabularyLayer } from "../data/layer";
import { RelationshipSeeder } from "./relationship_seeder";
import { WordSeeder } from "./word_seeder";
import type {
  RenderedFragment,
  RenderRequest,
  SearchRelationshipsRequest,
  SearchWordsRequest,
  SeedWordNetRequest,
  VocabularyDomainSummary,
  VocabularyWorkerMessage,
  VocabularyWorkerRequest,
} from "./vocabulary_worker_protocol";

interface WorkerScope {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: MessageEvent<VocabularyWorkerRequest>) => void): void;
}
const ctx = self as unknown as WorkerScope;

interface SeededDomain {
  name: string;
  parentName?: string;
  vocabulary: VocabularyLayer;
}

const domains = new Map<string, SeededDomain>();
const renderCache = new Map<string, RenderedFragment>();
// Domain names with a seed-wordnet run currently in flight -- guards
// against a rapid double click (or two independent UI callers) firing
// two overlapping seedWordNet passes against the same Domain at once;
// the client itself also disables its trigger while "running" (this
// module's own handleSeedWordNet posts that state), so this is a
// defensive backstop, not the primary guard.
const wordNetSeedingDomains = new Set<string>();

function post(message: VocabularyWorkerMessage): void {
  ctx.postMessage(message);
}

function summaryOf(domain: SeededDomain): VocabularyDomainSummary {
  return {
    name: domain.name,
    parentName: domain.parentName,
    wordCount: domain.vocabulary.dictionary.totalEntries(),
    relationshipCount: domain.vocabulary.lexicalRelationships.totalRelationships(),
  };
}

async function handleInit(): Promise<void> {
  try {
    post({ type: "status", state: "running", detail: "Loading the Common Vocabulary Cache…" });
    const commonDomain: SeededDomain = { name: "Common", vocabulary: new VocabularyLayer("Common") };
    const wordSeeder = new WordSeeder("en");
    const wordsSeeded = wordSeeder.seedDomain(commonDomain);

    post({ type: "status", state: "running", detail: `Seeded ${wordsSeeded} words — seeding relationships…` });
    const relationshipSeeder = new RelationshipSeeder("en");
    const relationshipsSeeded = await relationshipSeeder.seedDomain(commonDomain);
    domains.set(commonDomain.name, commonDomain);

    post({ type: "status", state: "running", detail: `Seeded ${relationshipsSeeded} relationships — bootstrapping Physics…` });
    const physicsDomain: SeededDomain = { name: "Physics", parentName: "Common", vocabulary: new VocabularyLayer("Physics") };
    physicsDomain.vocabulary.dictionary.seedFrom(commonDomain.vocabulary.dictionary);
    domains.set(physicsDomain.name, physicsDomain);

    const summaries: VocabularyDomainSummary[] = [...domains.values()].map(summaryOf);

    post({ type: "status", state: "done", detail: `${domains.size} Domains ready` });
    post({ type: "ready", domains: summaries });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
  }
}

/** Handles an on-demand SeedWordNetRequest -- see that request type's
 * own docstring (vocabulary_worker_protocol.ts) for why it always
 * targets "Common" in practice, even though it's addressed by name.
 * Reports progress via the same "status" channel handleInit uses
 * (WordSeeder.seedWordNet's own onProgress -- word_seeder.ts's own
 * docstring on why each call is followed by a yield back to the event
 * loop, which is what lets these messages actually leave the Worker
 * one by one instead of all arriving at once after the whole run
 * finishes), then invalidates that Domain's cached DictionaryView
 * fragment (it's now stale -- WordNet just added Words/relationships
 * to the same Dictionary/LexicalRelationshipStore DictionaryView
 * rendered against) and posts a DomainUpdatedMessage with the Domain's
 * refreshed counts. */
async function handleSeedWordNet(request: SeedWordNetRequest): Promise<void> {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "error", message: `Vocabulary Service: unknown Domain '${request.domain}'` });
    return;
  }
  if (wordNetSeedingDomains.has(domain.name)) return;
  wordNetSeedingDomains.add(domain.name);

  try {
    post({ type: "status", state: "running", detail: `Loading Princeton WordNet 3.1 for ${domain.name}…`, progress: 0 });
    const seeder = new WordSeeder("en");
    // Each pass reports its own 0->1 progress fraction (word_seeder.ts's
    // own seedWordNet docstring on the two passes) -- the bar fills once
    // for word/synonym seeding, then again for every other relationship
    // kind, rather than trying to divide one bar's own fraction across
    // two passes whose relative durations aren't known up front.
    const phaseLabel: Record<"words" | "relationships", string> = { words: "words", relationships: "relationships" };
    const result = await seeder.seedWordNet(domain, (phase, processed, total) => {
      post({
        type: "status",
        state: "running",
        detail: `Seeding WordNet ${phaseLabel[phase]} into ${domain.name} — ${processed.toLocaleString()} / ${total.toLocaleString()} synsets…`,
        progress: processed / total,
      });
    });

    renderCache.delete(domain.name);
    post({
      type: "status",
      state: "done",
      detail: `WordNet seeded into ${domain.name} — ${result.wordsSeeded.toLocaleString()} words, ${result.relationshipsSeeded.toLocaleString()} relationships`,
    });
    post({ type: "domain-updated", domain: summaryOf(domain) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
  } finally {
    wordNetSeedingDomains.delete(domain.name);
  }
}

/** Wrapped in try/catch, unlike this function's earlier version --
 * DictionaryView.renderFragment() is generally cheap against the
 * Common Vocabulary Cache scale this was first built for, but a much
 * larger Domain (WordSeeder.seedWordNet's own ~211,000 Words) can still
 * hit MAX_INTERACTIVE_WORDS's own capacity ceiling in ways that are
 * hard to fully rule out in advance (dictionary_view.ts's own
 * docstring on why JSON.stringify itself can throw past a certain
 * size). Before this wrapping, an exception here left the client's
 * matching renderDomain() Promise pending forever -- nothing ever
 * posted a "rendered" message for that requestId, and nothing told the
 * client to stop waiting either. */
function handleRender(request: RenderRequest): void {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "render-error", requestId: request.requestId, message: `Vocabulary Service: unknown Domain '${request.domain}'` });
    return;
  }

  const cached = renderCache.get(domain.name);
  if (cached !== undefined) {
    post({ type: "rendered", requestId: request.requestId, domain: domain.name, fragment: cached });
    return;
  }

  try {
    const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.lexicalRelationships, {
      title: `LIRA — ${domain.name}`,
      domainName: domain.name,
    });
    const [style, body, script] = view.renderFragment();
    const fragment: RenderedFragment = { style, body, script };
    renderCache.set(domain.name, fragment);
    post({ type: "rendered", requestId: request.requestId, domain: domain.name, fragment });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "render-error", requestId: request.requestId, message });
    post({ type: "error", message: `Vocabulary Service: failed to render '${domain.name}': ${message}` });
  }
}

/** Resolves a Words-tab search on demand, against the real Dictionary
 * (DictionaryView.searchWords()) rather than a pre-embedded array --
 * the fragment's own script dispatches a "lira-search-words" DOM event
 * for this whenever the target Domain is over MAX_INTERACTIVE_WORDS
 * (dictionary_view.ts's own renderWordsOverCapacity()); PortalShell
 * relays it here (portal_shell.ts's own bridge) and relays the result
 * back the same way. Always posts a result, even for an unknown Domain
 * (empty), rather than leaving the caller's search hanging. */
function handleSearchWords(request: SearchWordsRequest): void {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "search-words-result", requestId: request.requestId, words: [], totalMatches: 0 });
    return;
  }

  const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.lexicalRelationships, {
    title: `LIRA — ${domain.name}`,
    domainName: domain.name,
  });
  const { words, totalMatches } = view.searchWords({
    word: request.word,
    gloss: request.gloss,
    definition: request.definition,
    pos: request.pos,
    domain: request.domainLabel,
    rootWordsOnly: request.rootWordsOnly,
    limit: request.limit,
  });
  post({ type: "search-words-result", requestId: request.requestId, words, totalMatches });
}

function handleSearchRelationships(request: SearchRelationshipsRequest): void {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "search-relationships-result", requestId: request.requestId, relationships: [], totalMatches: 0 });
    return;
  }

  const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.lexicalRelationships, {
    title: `LIRA — ${domain.name}`,
    domainName: domain.name,
  });
  const { relationships, totalMatches } = view.searchRelationships({
    wordId: request.wordId,
    query: request.query,
    limit: request.limit,
  });
  post({ type: "search-relationships-result", requestId: request.requestId, relationships, totalMatches });
}

ctx.addEventListener("message", (event) => {
  const request = event.data;
  if (request.type === "init") void handleInit();
  else if (request.type === "render") handleRender(request);
  else if (request.type === "seed-wordnet") void handleSeedWordNet(request);
  else if (request.type === "search-words") handleSearchWords(request);
  else if (request.type === "search-relationships") handleSearchRelationships(request);
});
