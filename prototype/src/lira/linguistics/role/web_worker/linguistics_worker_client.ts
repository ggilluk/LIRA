import type {
  LinguisticServiceState,
  LinguisticsWorkerMessage,
  LinguisticsWorkerRequest,
  ReadDocumentResult,
  ReadResult,
} from "./linguistics_worker_protocol";

export type LinguisticsStatusListener = (state: LinguisticServiceState, detail?: string) => void;

/** Main-thread handle to the Linguistic Service worker
 * (linguistics_worker.ts) -- starts the worker, turns its postMessage
 * protocol into promise-based calls (`init()`, `read()`), and fans its
 * status messages out to any number of listeners, the same shape
 * vocabulary/role/web_worker/vocabulary_worker_client.ts's own
 * VocabularyWorkerClient already gives the Vocabulary Service. One
 * client owns exactly one worker. */
export class LinguisticsWorkerClient {
  private readonly worker: Worker;
  private readonly statusListeners = new Set<LinguisticsStatusListener>();
  private readyResolvers: Array<(wordCount: number) => void> = [];
  private readonly pendingReads = new Map<string, { resolve: (result: ReadResult) => void; reject: (error: Error) => void }>();
  private readonly pendingReadDocuments = new Map<string, { resolve: (result: ReadDocumentResult) => void; reject: (error: Error) => void }>();

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

  /** Hands this worker one end of a MessageChannel it then shares
   * directly with the Vocabulary Service worker -- main.ts's own
   * one-time wiring call, paired with VocabularyWorkerClient.linkPort
   * on the other end of the same channel. `port` is transferred, not
   * cloned. */
  linkVocabularyPort(port: MessagePort): void {
    this.worker.postMessage({ type: "link-vocabulary-port", port }, [port]);
  }

  /** Reads one sentence's worth of text through the worker's
   * LinguisticController and resolves with its predicted structure plus
   * the full search trace -- the same `{predicted, trace}` shape
   * sentence_reader_server.py's own `/api/read` returns, plus `words`
   * and `learning` (this port's own additions). `learningEnabled`
   * mirrors the Sentence Reader UI's own checkbox at the moment this
   * call was made -- see linguistics_worker_protocol.ts's own
   * `ReadRequest.learningEnabled` docstring for why it's sent fresh per
   * call rather than toggled as separate worker state. */
  read(text: string, learningEnabled: boolean, skipLearning = false): Promise<ReadResult> {
    const requestId = `read-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      this.pendingReads.set(requestId, { resolve, reject });
      this.post({ type: "read", requestId, text, learningEnabled, skipLearning });
    });
  }

  /** Reads `text` as a full Document -- the tree view's own entry point
   * (ui/sentence_reader_view.ts), returning the Document/Heading/
   * Paragraph/Sentence-summary tree DocumentReader built plus how much
   * this call reinforced the worker's own LexicalEvidenceStore. Does not
   * return a trace -- fetch a selected Sentence's own full predicted
   * structure and trace via `read(sentenceText, learningEnabled, true)`
   * once its node is chosen in the tree (the `skipLearning: true` there
   * matters: this call already recorded every validated Sentence in the
   * Document, so a later per-sentence detail fetch must not double-count
   * it). */
  readDocument(text: string, learningEnabled: boolean): Promise<ReadDocumentResult> {
    const requestId = `read-doc-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      this.pendingReadDocuments.set(requestId, { resolve, reject });
      this.post({ type: "read-document", requestId, text, learningEnabled });
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
    } else if (message.type === "read-document-result") {
      const pending = this.pendingReadDocuments.get(message.requestId);
      if (pending) {
        this.pendingReadDocuments.delete(message.requestId);
        pending.resolve(message.result);
      }
    } else if (message.type === "error") {
      if (message.requestId) {
        const pendingRead = this.pendingReads.get(message.requestId);
        if (pendingRead) {
          this.pendingReads.delete(message.requestId);
          pendingRead.reject(new Error(message.message));
          return;
        }
        const pendingReadDocument = this.pendingReadDocuments.get(message.requestId);
        if (pendingReadDocument) {
          this.pendingReadDocuments.delete(message.requestId);
          pendingReadDocument.reject(new Error(message.message));
          return;
        }
      }
      console.error("Linguistic Service error:", message.message);
    }
  }
}
