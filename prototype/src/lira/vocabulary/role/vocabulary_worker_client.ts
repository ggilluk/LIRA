import type {
  RenderedFragment,
  VocabularyDomainSummary,
  VocabularyServiceState,
  VocabularyWorkerMessage,
  VocabularyWorkerRequest,
} from "./vocabulary_worker_protocol";

export type VocabularyStatusListener = (state: VocabularyServiceState, detail?: string, progress?: number) => void;
export type VocabularyDomainUpdateListener = (domain: VocabularyDomainSummary) => void;

/** Main-thread handle to the Vocabulary Service worker
 * (vocabulary_worker.ts) -- starts the worker, turns its postMessage
 * protocol into promise-based calls (`init()`, `renderDomain()`) plus
 * one fire-and-forget call (`seedWordNet()`), and fans its status
 * messages out to any number of listeners (the LoadingScreen during
 * startup, the persistent ServiceStatusView afterwards -- both just
 * call `onStatus`, neither knows about the other). One client owns
 * exactly one worker; the Portal shell is built around a single
 * Vocabulary Service instance. */
export class VocabularyWorkerClient {
  private readonly worker: Worker;
  private readonly statusListeners = new Set<VocabularyStatusListener>();
  private readonly domainUpdateListeners = new Set<VocabularyDomainUpdateListener>();
  private readyResolvers: Array<(domains: readonly VocabularyDomainSummary[]) => void> = [];
  private readonly pendingRenders = new Map<string, { resolve: (fragment: RenderedFragment) => void; reject: (error: Error) => void }>();

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
   * Portal shell to mount directly into its own DOM. Rejects on a
   * RenderErrorMessage (e.g. an unknown Domain name) rather than
   * hanging forever -- that message type's own docstring
   * (vocabulary_worker_protocol.ts) on the failure mode this replaced. */
  renderDomain(name: string): Promise<RenderedFragment> {
    const requestId = `${name}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      this.pendingRenders.set(requestId, { resolve, reject });
      this.post({ type: "render", requestId, domain: name });
    });
  }

  /** Fires an on-demand WordSeeder.seedWordNet pass inside the worker
   * against the named Domain (SeedWordNetRequest's own docstring on why
   * this is always "Common" in practice). Fire-and-forget by design --
   * progress and completion both surface through `onStatus` (state
   * "running" with a growing `progress` fraction throughout, then
   * "done") and `onDomainUpdated` (once, with the Domain's refreshed
   * counts), the same channels every other Vocabulary Service activity
   * already reports through, rather than a second parallel promise-based
   * API only this one call would use. */
  seedWordNet(domainName: string): void {
    this.post({ type: "seed-wordnet", domain: domainName });
  }

  /** Subscribes to every DomainUpdatedMessage the Service posts (today,
   * only after a seedWordNet run finishes). Returns an unsubscribe
   * function. */
  onDomainUpdated(listener: VocabularyDomainUpdateListener): () => void {
    this.domainUpdateListeners.add(listener);
    return () => {
      this.domainUpdateListeners.delete(listener);
    };
  }

  private post(request: VocabularyWorkerRequest): void {
    this.worker.postMessage(request);
  }

  private handleMessage(message: VocabularyWorkerMessage): void {
    if (message.type === "status") {
      for (const listener of this.statusListeners) listener(message.state, message.detail, message.progress);
    } else if (message.type === "ready") {
      const resolvers = this.readyResolvers.splice(0);
      for (const resolve of resolvers) resolve(message.domains);
    } else if (message.type === "rendered") {
      const pending = this.pendingRenders.get(message.requestId);
      if (pending) {
        this.pendingRenders.delete(message.requestId);
        pending.resolve(message.fragment);
      }
    } else if (message.type === "render-error") {
      const pending = this.pendingRenders.get(message.requestId);
      if (pending) {
        this.pendingRenders.delete(message.requestId);
        pending.reject(new Error(message.message));
      }
    } else if (message.type === "domain-updated") {
      for (const listener of this.domainUpdateListeners) listener(message.domain);
    } else if (message.type === "error") {
      console.error("Vocabulary Service error:", message.message);
    }
  }
}
