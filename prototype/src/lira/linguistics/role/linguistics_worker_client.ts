import type {
  LinguisticServiceState,
  LinguisticsWorkerMessage,
  LinguisticsWorkerRequest,
  ReadResult,
} from "./linguistics_worker_protocol";

export type LinguisticsStatusListener = (state: LinguisticServiceState, detail?: string) => void;

/** Main-thread handle to the Linguistic Service worker
 * (linguistics_worker.ts) -- starts the worker, turns its postMessage
 * protocol into promise-based calls (`init()`, `read()`), and fans its
 * status messages out to any number of listeners, the same shape
 * vocabulary/role/vocabulary_worker_client.ts's own VocabularyWorkerClient
 * already gives the Vocabulary Service. One client owns exactly one
 * worker. */
export class LinguisticsWorkerClient {
  private readonly worker: Worker;
  private readonly statusListeners = new Set<LinguisticsStatusListener>();
  private readyResolvers: Array<(wordCount: number) => void> = [];
  private readonly pendingReads = new Map<string, { resolve: (result: ReadResult) => void; reject: (error: Error) => void }>();

  constructor() {
    this.worker = new Worker(new URL("./linguistics_worker.ts", import.meta.url), { type: "module" });
    this.worker.addEventListener("message", (event: MessageEvent<LinguisticsWorkerMessage>) => {
      this.handleMessage(event.data);
    });
  }

  /** Subscribes to every status update the Service reports (loading
   * stages during init, "done" once ready, "error" on failure). Returns
   * an unsubscribe function. */
  onStatus(listener: LinguisticsStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /** Starts seeding inside the worker; resolves with the number of
   * words seeded once the grammar is configured and ready to read.
   * Status updates arrive via `onStatus` throughout, not just at the
   * end. */
  init(): Promise<number> {
    return new Promise((resolve) => {
      this.readyResolvers.push(resolve);
      this.post({ type: "init" });
    });
  }

  /** Reads one sentence's worth of text through the worker's
   * LinguisticController and resolves with its predicted structure plus
   * the full search trace -- the same `{predicted, trace}` shape
   * sentence_reader_server.py's own `/api/read` returns. */
  read(text: string): Promise<ReadResult> {
    const requestId = `read-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      this.pendingReads.set(requestId, { resolve, reject });
      this.post({ type: "read", requestId, text });
    });
  }

  private post(request: LinguisticsWorkerRequest): void {
    this.worker.postMessage(request);
  }

  private handleMessage(message: LinguisticsWorkerMessage): void {
    if (message.type === "status") {
      for (const listener of this.statusListeners) listener(message.state, message.detail);
    } else if (message.type === "ready") {
      const resolvers = this.readyResolvers.splice(0);
      for (const resolve of resolvers) resolve(message.wordCount);
    } else if (message.type === "read-result") {
      const pending = this.pendingReads.get(message.requestId);
      if (pending) {
        this.pendingReads.delete(message.requestId);
        pending.resolve(message.result);
      }
    } else if (message.type === "error") {
      if (message.requestId) {
        const pending = this.pendingReads.get(message.requestId);
        if (pending) {
          this.pendingReads.delete(message.requestId);
          pending.reject(new Error(message.message));
          return;
        }
      }
      console.error("Linguistic Service error:", message.message);
    }
  }
}
