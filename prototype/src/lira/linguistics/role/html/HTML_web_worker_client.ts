import type {
  HTMLCrawlOptions,
  HTMLCrawlResult,
  HTMLServiceState,
  HTMLWorkerMessage,
  HTMLWorkerRequest,
} from "./HTML_web_worker_protocol";
import type { CrawledPage } from "./WebCrawler";

export type HTMLStatusListener = (state: HTMLServiceState, detail?: string, requestId?: string) => void;
export type HTMLPageListener = (page: CrawledPage) => void;

export interface HTMLCrawlHandle {
  /** Worker request identity, exposed so callers can correlate UI state. */
  requestId: string;
  /** Resolves when the crawl completes or is cooperatively cancelled. */
  result: Promise<HTMLCrawlResult>;
  /** Requests cooperative cancellation of this crawl. */
  cancel(): void;
}

/** Main-thread handle to HTML_web_worker.ts -- the same client/service split
 * used by LinguisticsWorkerClient and VocabularyWorkerClient. One client owns
 * exactly one module worker and turns its postMessage protocol into init/crawl
 * calls plus status and per-page listeners. */
export class HTMLWorkerClient {
  private readonly worker: Worker;
  private readonly statusListeners = new Set<HTMLStatusListener>();
  private readyResolvers: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];
  private readonly pendingCrawls = new Map<string, {
    resolve: (result: HTMLCrawlResult) => void;
    reject: (error: Error) => void;
    onPage?: HTMLPageListener;
  }>();

  constructor() {
    this.worker = new Worker(new URL("./HTML_web_worker.ts", import.meta.url), { type: "module" });
    this.worker.addEventListener("message", (event: MessageEvent<HTMLWorkerMessage>) => {
      this.handleMessage(event.data);
    });
  }

  /** Subscribes to worker service/crawl status. Returns an unsubscribe function. */
  onStatus(listener: HTMLStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /** Confirms that the worker runtime can host HTMLProcessor/WebCrawler. */
  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.readyResolvers.push({ resolve, reject });
      this.post({ type: "init" });
    });
  }

  /** Starts one crawl. Pages are delivered incrementally through `onPage`
   * immediately after the worker's WebCrawler has supplied them to
   * HTMLProcessor. The returned handle owns completion and cancellation. */
  crawl(seedUrl: string | URL, options: HTMLCrawlOptions = {}, onPage?: HTMLPageListener): HTMLCrawlHandle {
    const requestId = `html-crawl-${Math.random().toString(36).slice(2)}`;
    const result = new Promise<HTMLCrawlResult>((resolve, reject) => {
      this.pendingCrawls.set(requestId, { resolve, reject, onPage });
      this.post({ type: "crawl", requestId, seedUrl: String(seedUrl), options });
    });

    return {
      requestId,
      result,
      cancel: () => this.post({ type: "cancel-crawl", requestId }),
    };
  }

  private post(request: HTMLWorkerRequest): void {
    this.worker.postMessage(request);
  }

  private handleMessage(message: HTMLWorkerMessage): void {
    if (message.type === "status") {
      for (const listener of this.statusListeners) listener(message.state, message.detail, message.requestId);
    } else if (message.type === "ready") {
      const pending = this.readyResolvers.splice(0);
      for (const { resolve } of pending) resolve();
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
      if (initPending.length === 0) console.error("HTML Service error:", message.message);
    }
  }
}
