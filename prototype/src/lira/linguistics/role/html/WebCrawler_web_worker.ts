/** Web Crawler coordinator worker.
 *
 * Runtime shape:
 *
 *   Main thread
 *       -> one WebCrawler_web_worker
 *              -> HTML_web_worker #1
 *              -> HTML_web_worker #2
 *              -> ... N processors
 *
 * The crawler worker alone owns URL discovery state: queue, visited/queued
 * sets, depth, same-origin policy, page limit and cancellation. HTML workers
 * are deliberately stateless page processors. Each receives one URL, fetches
 * and parses it through HTMLProcessor, extracts outgoing links, returns the
 * processed page, and becomes available for another job.
 *
 * This makes processor concurrency a hosting concern rather than an
 * HTMLProcessor concern: the same parser code can run in 1, 2, 4 or more worker
 * instances without changing the linguistic/data model. */

import type {
  HTMLProcessedPage,
  HTMLWorkerMessage,
  HTMLWorkerRequest,
} from "./HTML_web_worker_protocol";
import type {
  WebCrawlerCrawlRequest,
  WebCrawlerWorkerMessage,
  WebCrawlerWorkerRequest,
} from "./WebCrawler_web_worker_protocol";

interface WorkerScope {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: MessageEvent<WebCrawlerWorkerRequest>) => void): void;
}

interface CrawlQueueEntry {
  url: string;
  depth: number;
}

interface CompletedJob {
  slot: HTMLProcessorSlot;
  entry: CrawlQueueEntry;
  page?: HTMLProcessedPage;
  error?: Error;
}

const ctx = self as unknown as WorkerScope;
let processorPool: HTMLProcessorSlot[] = [];
const cancelledCrawls = new Set<string>();
const activeCrawls = new Set<string>();

function post(message: WebCrawlerWorkerMessage): void {
  ctx.postMessage(message);
}

/** One hosted HTML Processor worker. A slot accepts only one page at a time. */
class HTMLProcessorSlot {
  readonly worker: Worker;
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  private readyReject!: (error: Error) => void;
  private pending?: {
    requestId: string;
    resolve: (page: HTMLProcessedPage) => void;
    reject: (error: Error) => void;
  };

  constructor(readonly index: number) {
    this.worker = new Worker(new URL("./HTML_web_worker.ts", import.meta.url), { type: "module" });
    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    this.worker.addEventListener("message", (event: MessageEvent<HTMLWorkerMessage>) => this.handleMessage(event.data));
    this.post({ type: "init" });
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  process(entry: CrawlQueueEntry): Promise<HTMLProcessedPage> {
    if (this.pending) return Promise.reject(new Error(`HTML processor ${this.index} is already busy`));
    const requestId = `processor-${this.index}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      this.pending = { requestId, resolve, reject };
      this.post({ type: "process-page", requestId, url: entry.url, depth: entry.depth });
    });
  }

  terminate(): void {
    this.worker.terminate();
    this.pending?.reject(new Error(`HTML processor ${this.index} terminated`));
    this.pending = undefined;
  }

  private post(request: HTMLWorkerRequest): void {
    this.worker.postMessage(request);
  }

  private handleMessage(message: HTMLWorkerMessage): void {
    if (message.type === "ready") {
      this.readyResolve();
      return;
    }

    if (message.type === "process-page-result") {
      const pending = this.pending;
      if (pending?.requestId === message.requestId) {
        this.pending = undefined;
        pending.resolve(message.page);
      }
      return;
    }

    if (message.type === "error") {
      if (message.requestId && this.pending?.requestId === message.requestId) {
        const pending = this.pending;
        this.pending = undefined;
        pending.reject(new Error(message.message));
      } else {
        this.readyReject(new Error(message.message));
      }
    }
  }
}

async function handleInit(processorCount = 4): Promise<void> {
  if (!Number.isInteger(processorCount) || processorCount <= 0) {
    const message = "Web Crawler Service: processorCount must be a positive integer";
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
    return;
  }

  for (const slot of processorPool) slot.terminate();
  processorPool = Array.from({ length: processorCount }, (_, index) => new HTMLProcessorSlot(index));

  post({ type: "status", state: "running", detail: `Starting ${processorCount} HTML processor worker(s)…` });
  try {
    await Promise.all(processorPool.map((slot) => slot.ready()));
    post({ type: "status", state: "done", detail: `${processorCount} HTML processor worker(s) ready` });
    post({ type: "ready", processorCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
  }
}

async function handleCrawl(request: WebCrawlerCrawlRequest): Promise<void> {
  if (processorPool.length === 0) {
    post({ type: "error", requestId: request.requestId, message: "Web Crawler Service: not initialised" });
    return;
  }
  if (activeCrawls.has(request.requestId)) {
    post({ type: "error", requestId: request.requestId, message: `Web Crawler Service: crawl '${request.requestId}' is already running` });
    return;
  }

  const maxPages = positiveInteger(request.options?.maxPages, 100, "maxPages");
  const maxDepth = nonNegativeInteger(request.options?.maxDepth, 2, "maxDepth");
  const sameOriginOnly = request.options?.sameOriginOnly ?? true;
  const seed = normaliseUrl(new URL(request.seedUrl));

  const queue: CrawlQueueEntry[] = [{ url: seed.href, depth: 0 }];
  const queued = new Set<string>([seed.href]);
  const visited = new Set<string>();
  const freeSlots = [...processorPool];
  const inFlight = new Set<Promise<CompletedJob>>();
  let dispatchedCount = 0;
  let pageCount = 0;

  activeCrawls.add(request.requestId);
  cancelledCrawls.delete(request.requestId);
  post({ type: "status", state: "running", requestId: request.requestId, detail: `Crawling ${seed.href}` });

  try {
    while (!cancelledCrawls.has(request.requestId) && (queue.length > 0 || inFlight.size > 0)) {
      while (
        !cancelledCrawls.has(request.requestId) &&
        freeSlots.length > 0 &&
        queue.length > 0 &&
        dispatchedCount < maxPages
      ) {
        const entry = queue.shift()!;
        if (visited.has(entry.url)) continue;
        visited.add(entry.url);

        const slot = freeSlots.shift()!;
        dispatchedCount += 1;
        let job!: Promise<CompletedJob>;
        job = slot.process(entry)
          .then((page) => ({ slot, entry, page }))
          .catch((error: unknown) => ({
            slot,
            entry,
            error: error instanceof Error ? error : new Error(String(error)),
          }))
          .finally(() => inFlight.delete(job));
        inFlight.add(job);
      }

      if (inFlight.size === 0) break;

      const completed = await Promise.race(inFlight);
      freeSlots.push(completed.slot);
      if (!completed.page || completed.error || cancelledCrawls.has(request.requestId)) continue;

      pageCount += 1;
      post({ type: "crawl-page", requestId: request.requestId, page: completed.page });

      if (completed.entry.depth >= maxDepth) continue;
      for (const href of completed.page.discoveredUrls) {
        let candidate: URL;
        try {
          candidate = normaliseUrl(new URL(href));
        } catch {
          continue;
        }
        if (candidate.protocol !== "http:" && candidate.protocol !== "https:") continue;
        if (sameOriginOnly && candidate.origin !== seed.origin) continue;
        if (visited.has(candidate.href) || queued.has(candidate.href)) continue;
        queued.add(candidate.href);
        queue.push({ url: candidate.href, depth: completed.entry.depth + 1 });
      }
    }

    // Cooperative cancellation stops new dispatch immediately. Existing page
    // jobs are allowed to finish in their processor workers; their results are
    // deliberately ignored for this crawl after cancellation.
    const cancelled = cancelledCrawls.has(request.requestId);
    post({
      type: "status",
      state: "done",
      requestId: request.requestId,
      detail: cancelled ? `Crawl cancelled after ${pageCount} page(s)` : `Crawled ${pageCount} page(s)`,
    });
    post({ type: "crawl-result", requestId: request.requestId, result: { pageCount, cancelled } });
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    post({ type: "status", state: "error", requestId: request.requestId, detail: message });
    post({ type: "error", requestId: request.requestId, message });
  } finally {
    activeCrawls.delete(request.requestId);
    cancelledCrawls.delete(request.requestId);
  }
}

function handleCancelCrawl(requestId: string): void {
  if (activeCrawls.has(requestId)) cancelledCrawls.add(requestId);
}

function normaliseUrl(url: URL): URL {
  const normalised = new URL(url.href);
  normalised.hash = "";
  return normalised;
}

function positiveInteger(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved <= 0) throw new Error(`${name} must be a positive integer.`);
  return resolved;
}

function nonNegativeInteger(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < 0) throw new Error(`${name} must be a non-negative integer.`);
  return resolved;
}

ctx.addEventListener("message", (event) => {
  const request = event.data;
  if (request.type === "init") void handleInit(request.processorCount);
  else if (request.type === "crawl") void handleCrawl(request);
  else if (request.type === "cancel-crawl") handleCancelCrawl(request.requestId);
});
