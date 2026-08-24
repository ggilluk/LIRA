import type {
  HTMLProcessedPage,
  HTMLServiceState,
  HTMLWorkerMessage,
  HTMLWorkerRequest,
} from "./HTML_web_worker_protocol";

export type HTMLStatusListener = (state: HTMLServiceState, detail?: string, requestId?: string) => void;

/** Main-thread/direct-owner handle to one HTML Processor worker.
 *
 * WebCrawler_web_worker.ts creates multiple raw workers directly for its pool,
 * but this client keeps the same promise-oriented convention available to any
 * other caller that needs one dedicated HTML Processor Service. */
export class HTMLWorkerClient {
  private readonly worker: Worker;
  private readonly statusListeners = new Set<HTMLStatusListener>();
  private readyResolvers: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];
  private readonly pendingPages = new Map<string, {
    resolve: (page: HTMLProcessedPage) => void;
    reject: (error: Error) => void;
  }>();

  constructor() {
    this.worker = new Worker(new URL("./HTML_web_worker.ts", import.meta.url), { type: "module" });
    this.worker.addEventListener("message", (event: MessageEvent<HTMLWorkerMessage>) => {
      this.handleMessage(event.data);
    });
  }

  onStatus(listener: HTMLStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.readyResolvers.push({ resolve, reject });
      this.post({ type: "init" });
    });
  }

  /** Reads and parses exactly one page in this worker. */
  processPage(url: string | URL, depth = 0): Promise<HTMLProcessedPage> {
    const requestId = `html-page-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      this.pendingPages.set(requestId, { resolve, reject });
      this.post({ type: "process-page", requestId, url: String(url), depth });
    });
  }

  terminate(): void {
    this.worker.terminate();
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
    } else if (message.type === "process-page-result") {
      const pending = this.pendingPages.get(message.requestId);
      if (pending) {
        this.pendingPages.delete(message.requestId);
        pending.resolve(message.page);
      }
    } else if (message.type === "error") {
      if (message.requestId) {
        const pending = this.pendingPages.get(message.requestId);
        if (pending) {
          this.pendingPages.delete(message.requestId);
          pending.reject(new Error(message.message));
          return;
        }
      }

      const initPending = this.readyResolvers.splice(0);
      for (const { reject } of initPending) reject(new Error(message.message));
      if (initPending.length === 0) console.error("HTML Processor Service error:", message.message);
    }
  }
}
