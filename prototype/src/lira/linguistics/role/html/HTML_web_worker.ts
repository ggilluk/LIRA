/** HTML Processor Service worker.
 *
 * This worker deliberately owns no crawl state. One instance performs one
 * page-processing job at a time for WebCrawler_web_worker.ts:
 *
 *   URL -> HTMLProcessor.readPage()
 *       -> HTMLProcessor.parsePage()
 *       -> discover outgoing page URLs
 *       -> post structured result
 *
 * Multiple instances may run concurrently. The crawler worker owns their pool,
 * URL queue, depth, limits, de-duplication and scheduling. This mirrors LIRA's
 * existing worker/service convention while keeping crawler and parser roles
 * separate. */

import { HTMLProcessor } from "./HTML_Processor";
import { discoverPageUrls } from "./WebCrawler";
import type {
  HTMLProcessPageRequest,
  HTMLWorkerMessage,
  HTMLWorkerRequest,
} from "./HTML_web_worker_protocol";

interface WorkerScope {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: MessageEvent<HTMLWorkerRequest>) => void): void;
}

const ctx = self as unknown as WorkerScope;
const htmlProcessor = new HTMLProcessor();

function post(message: HTMLWorkerMessage): void {
  ctx.postMessage(message);
}

function handleInit(): void {
  if (typeof DOMParser === "undefined") {
    const message = "HTML Processor Service: DOMParser is not available in this Web Worker runtime";
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
    return;
  }

  post({ type: "status", state: "done", detail: "HTML processor ready" });
  post({ type: "ready" });
}

async function handleProcessPage(request: HTMLProcessPageRequest): Promise<void> {
  if (typeof DOMParser === "undefined") {
    post({
      type: "error",
      requestId: request.requestId,
      message: "HTML Processor Service: DOMParser is not available in this Web Worker runtime",
    });
    return;
  }

  post({ type: "status", state: "running", requestId: request.requestId, detail: `Processing ${request.url}` });

  try {
    const html = await htmlProcessor.readPage(request.url);
    const document = htmlProcessor.parsePage(html);
    const discoveredUrls = discoverPageUrls(html, request.url)
      .filter((url) => url.protocol === "http:" || url.protocol === "https:")
      .map((url) => {
        const normalised = new URL(url.href);
        normalised.hash = "";
        return normalised.href;
      });

    post({
      type: "process-page-result",
      requestId: request.requestId,
      page: {
        url: request.url,
        depth: request.depth,
        html,
        document,
        discoveredUrls,
      },
    });
    post({ type: "status", state: "done", requestId: request.requestId, detail: `Processed ${request.url}` });
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    post({ type: "status", state: "error", requestId: request.requestId, detail: message });
    post({ type: "error", requestId: request.requestId, message });
  }
}

ctx.addEventListener("message", (event) => {
  const request = event.data;
  if (request.type === "init") handleInit();
  else if (request.type === "process-page") void handleProcessPage(request);
});
