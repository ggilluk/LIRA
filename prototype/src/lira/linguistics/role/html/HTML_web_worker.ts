/** The HTML Service worker: hosts HTMLProcessor + WebCrawler off the main
 * thread, the same browser-Web-Worker service boundary used by
 * linguistics/role/web_worker/linguistics_worker.ts and
 * vocabulary/role/web_worker/vocabulary_worker.ts.
 *
 * The worker owns its crawler and processor instances. The main thread sends a
 * seed URL and clone-safe crawl options; each page is streamed back immediately
 * after WebCrawler has read it and HTMLProcessor has parsed it into LIRA HTML
 * data. This keeps network discovery and page ingestion off the UI thread.
 *
 * Browser workers do not universally expose DOMParser. HTMLProcessor and
 * WebCrawler currently use DOMParser, so init reports an explicit service error
 * when this worker runtime does not provide it rather than failing later during
 * a crawl. No fallback parser is invented here: that belongs to the HTML
 * processor implementation, not to worker hosting. */

import { HTMLProcessor } from "./HTML_Processor";
import { WebCrawler } from "./WebCrawler";
import type {
  HTMLCrawlRequest,
  HTMLWorkerMessage,
  HTMLWorkerRequest,
} from "./HTML_web_worker_protocol";

interface WorkerScope {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: MessageEvent<HTMLWorkerRequest>) => void): void;
}

const ctx = self as unknown as WorkerScope;
const htmlProcessor = new HTMLProcessor();
const webCrawler = new WebCrawler(htmlProcessor);

/** Request ids cancelled by the main thread. Cancellation is cooperative: an
 * in-flight fetch is allowed to finish, but no further page is posted or queued
 * by this worker once the generator returns control to this loop. */
const cancelledCrawls = new Set<string>();
const activeCrawls = new Set<string>();

function post(message: HTMLWorkerMessage): void {
  ctx.postMessage(message);
}

function handleInit(): void {
  if (typeof DOMParser === "undefined") {
    const message = "HTML Service: DOMParser is not available in this Web Worker runtime";
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
    return;
  }

  post({ type: "status", state: "done", detail: "HTML crawler ready" });
  post({ type: "ready" });
}

async function handleCrawl(request: HTMLCrawlRequest): Promise<void> {
  if (activeCrawls.has(request.requestId)) {
    post({ type: "error", requestId: request.requestId, message: `HTML Service: crawl '${request.requestId}' is already running` });
    return;
  }

  if (typeof DOMParser === "undefined") {
    post({
      type: "error",
      requestId: request.requestId,
      message: "HTML Service: DOMParser is not available in this Web Worker runtime",
    });
    return;
  }

  activeCrawls.add(request.requestId);
  cancelledCrawls.delete(request.requestId);
  let pageCount = 0;

  post({ type: "status", state: "running", requestId: request.requestId, detail: `Crawling ${request.seedUrl}` });

  try {
    for await (const page of webCrawler.crawlPages(request.seedUrl, request.options)) {
      if (cancelledCrawls.has(request.requestId)) break;
      pageCount += 1;
      post({ type: "crawl-page", requestId: request.requestId, page });
    }

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

ctx.addEventListener("message", (event) => {
  const request = event.data;
  if (request.type === "init") handleInit();
  else if (request.type === "crawl") void handleCrawl(request);
  else if (request.type === "cancel-crawl") handleCancelCrawl(request.requestId);
});
