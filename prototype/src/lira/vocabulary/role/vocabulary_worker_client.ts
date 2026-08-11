import type {
  RenderedFragment,
  VocabularyDomainSummary,
  VocabularyServiceState,
  VocabularyWorkerMessage,
  VocabularyWorkerRequest,
} from "./vocabulary_worker_protocol";

export type VocabularyStatusListener = (state: VocabularyServiceState, detail?: string) => void;

/** Main-thread handle to the Vocabulary Service worker
 * (vocabulary_worker.ts) -- starts the worker, turns its postMessage
 * protocol into promise-based calls (`init()`, `renderDomain()`), and
 * fans its status messages out to any number of listeners (the
 * LoadingScreen during startup, the persistent ServiceStatusView
 * afterwards -- both just call `onStatus`, neither knows about the
 * other). One client owns exactly one worker; the Portal shell is built
 * around a single Vocabulary Service instance. */
export class VocabularyWorkerClient {
  private readonly worker: Worker;
  private readonly statusListeners = new Set<VocabularyStatusListener>();
  private readyResolvers: Array<(domains: readonly VocabularyDomainSummary[]) => void> = [];
  private readonly pendingRenders = new Map<string, (fragment: RenderedFragment) => void>();

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
   * Portal shell to mount directly into its own DOM. */
  renderDomain(name: string): Promise<RenderedFragment> {
    const requestId = `${name}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      this.pendingRenders.set(requestId, resolve);
      this.post({ type: "render", requestId, domain: name });
    });
  }

  private post(request: VocabularyWorkerRequest): void {
    this.worker.postMessage(request);
  }

  private handleMessage(message: VocabularyWorkerMessage): void {
    if (message.type === "status") {
      for (const listener of this.statusListeners) listener(message.state, message.detail);
    } else if (message.type === "ready") {
      const resolvers = this.readyResolvers.splice(0);
      for (const resolve of resolvers) resolve(message.domains);
    } else if (message.type === "rendered") {
      const resolve = this.pendingRenders.get(message.requestId);
      if (resolve) {
        this.pendingRenders.delete(message.requestId);
        resolve(message.fragment);
      }
    } else if (message.type === "error") {
      console.error("Vocabulary Service error:", message.message);
    }
  }
}
