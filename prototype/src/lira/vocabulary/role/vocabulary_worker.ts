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
 * in parallel. */

import { DictionaryView } from "../ui/dictionary_view";
import { VocabularyLayer } from "../data/layer";
import { RelationshipSeeder } from "./relationship_seeder";
import { WordSeeder } from "./word_seeder";
import type {
  RenderedFragment,
  RenderRequest,
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

function post(message: VocabularyWorkerMessage): void {
  ctx.postMessage(message);
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

    const summaries: VocabularyDomainSummary[] = [...domains.values()].map((domain) => ({
      name: domain.name,
      parentName: domain.parentName,
      wordCount: domain.vocabulary.dictionary.totalEntries(),
      relationshipCount: domain.vocabulary.lexicalRelationships.totalRelationships(),
    }));

    post({ type: "status", state: "done", detail: `${domains.size} Domains ready` });
    post({ type: "ready", domains: summaries });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
  }
}

function handleRender(request: RenderRequest): void {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "error", message: `Vocabulary Service: unknown Domain '${request.domain}'` });
    return;
  }

  const cached = renderCache.get(domain.name);
  if (cached !== undefined) {
    post({ type: "rendered", requestId: request.requestId, domain: domain.name, fragment: cached });
    return;
  }

  const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.lexicalRelationships, {
    title: `LIRA — ${domain.name}`,
    domainName: domain.name,
  });
  const [style, body, script] = view.renderFragment();
  const fragment: RenderedFragment = { style, body, script };
  renderCache.set(domain.name, fragment);
  post({ type: "rendered", requestId: request.requestId, domain: domain.name, fragment });
}

ctx.addEventListener("message", (event) => {
  const request = event.data;
  if (request.type === "init") void handleInit();
  else if (request.type === "render") handleRender(request);
});
