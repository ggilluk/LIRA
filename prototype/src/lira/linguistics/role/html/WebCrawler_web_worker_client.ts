import type { HTMLProcessedPage } from "./HTML_web_worker_protocol";
import type {
  WebCrawlerOptions,
  WebCrawlerResult,
  WebCrawlerServiceState,
  WebCrawlerWorkerMessage,
  WebCrawlerWorkerRequest,
} from "./WebCrawler_web_worker_protocol";

export type WebCrawlerStatusListener = (state: WebCrawlerServiceState, detail?: string, requestId?: string) => void;
export type WebCrawlerPageListener = (page: HTMLProcessedPage) => void;

export interface WebCrawlerHandle {
  requestId: string;
  result: Promise<WebCrawlerResult>;
  cancel(): void;
}

/** Main-thread handle to the crawler coordinator worker.
 *
 * One client owns one crawler worker. That crawler worker in turn owns N HTML
 * Processor workers, so the main thread sees one crawl service rather than
 * managing a parser-worker pool itself. */
export class WebCrawlerWorkerClient {
  private readonly worker: Worker;
  private readonly statusListeners = new Set<WebCrawlerStatusListener>();
  private readyResolvers: Array<{ resolve: (processorCount: number) => void; reject: (error: Error) => void }> = [];
  private readonly pendingCrawls = new Map<string, {
    resolve: (result: WebCrawlerResult) => void;
    reject: (error: Error) => void;
    onPage?: WebCrawlerPageListener;
  }>();

  constructor() {
    this.worker = new Worker(new URL("./WebCrawler_web_worker.ts", import.meta.url), { type: "module" });
    this.worker.addEventListener("message", (event: MessageEvent<WebCrawlerWorkerMessage>) => {
      this.handleMessage(event.data);
    });
  }

  onStatus(listener: WebCrawlerStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /** Starts the crawler and its HTML processor pool. Defaults to four processors. */
  init(processorCount = 4): Promise<number> {
    return new Promise((resolve, reject) => {
      this.readyResolvers.push({ resolve, reject });
      this.post({ type: "init", processorCount });
    });
  }

  /** Starts one crawl. Processed pages stream through `onPage` as individual
   * HTML Processor workers complete them; completion order may therefore differ
   * from dispatch order when pages take different amounts of time to process. */
  crawl(seedUrl: string | URL, options: WebCrawlerOptions = {}, onPage?: WebCrawlerPageListener): WebCrawlerHandle {
    const requestId = `web-crawl-${Math.random().toString(36).slice(2)}`;
    const result = new Promise<WebCrawlerResult>((resolve, reject) => {
      this.pendingCrawls.set(requestId, { resolve, reject, onPage });
      this.post({ type: "crawl", requestId, seedUrl: String(seedUrl), options });
    });

    return {
      requestId,
      result,
      cancel: () => this.post({ type: "cancel-crawl", requestId }),
    };
  }

  terminate(): void {
    this.worker.terminate();
  }

  private post(request: WebCrawlerWorkerRequest): void {
    this.worker.postMessage(request);
  }

  private handleMessage(message: WebCrawlerWorkerMessage): void {
    if (message.type === "status") {
      for (const listener of this.statusListeners) listener(message.state, message.detail, message.requestId);
    } else if (message.type === "ready") {
      const pending = this.readyResolvers.splice(0);
      for (const { resolve } of pending) resolve(message.processorCount);
    } else if (message.type === "crawl-page") {
      this.pendingCrawls.get(message.requestId)?.onPage?.(message.page);
    } else if (message.type === "crawl-result") {
      const pending = this.pendingCrawls.get(message.requestId);
      if (pending) {
        this.pendingCrawls.delete(message.requestId);
        pending.resolve(message.result);
      }
    } else if (message.type === "error") {
      if (message.requestId) {
        const pending = this.pendingCrawls.get(message.requestId);
        if (pending) {
          this.pendingCrawls.delete(message.requestId);
          pending.reject(new Error(message.message));
          return;
        }
      }

      const initPending = this.readyResolvers.splice(0);
      for (const { reject } of initPending) reject(new Error(message.message));
      if (initPending.length === 0) console.error("Web Crawler Service error:", message.message);
    }
  }
}
