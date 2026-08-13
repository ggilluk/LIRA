/** Status of one background Service -- the browser-tab equivalent of a
 * server-side process in the real system (a Vocabulary Service running
 * WordSeeder/RelationshipSeeder/DictionaryView inside a Web Worker
 * today; a Linguistics/Knowledge Service once those layers are ported).
 * This is UI-facing status, not a port of anything in the Python source
 * -- there is no Python equivalent of "watch a background process's
 * status from a page" because the Python implementation has no
 * persistent process to watch.
 *
 * Lives in Knowledge, alongside PortalShell/LoadingScreen/ServiceStatusView
 * (Knowledge is already where cross-layer composition UI lives -- see
 * portal_shell.ts's own docstring). `ServiceState` is a superset of
 * vocabulary/role/vocabulary_worker_protocol.ts's own status vocabulary
 * (that module defines its own minimal type rather than importing this
 * one, since Vocabulary must not depend on Knowledge); the Portal shell
 * maps a worker's reported state onto this board itself.
 *
 * `"not-ported"` is a real, permanent state, not a loading placeholder:
 * it means this layer has no Service to run at all yet (Linguistics,
 * Knowledge), and the UI should say so rather than imply one is coming
 * any moment. */
export type ServiceState = "not-ported" | "idle" | "running" | "done" | "error";

export interface ServiceStatus {
  id: string;
  label: string;
  state: ServiceState;
  detail?: string;
  // Fraction in [0, 1] for a running background task with a known
  // length (e.g. WordSeeder.seedWordNet's own synset count, relayed via
  // vocabulary_worker_protocol.ts's StatusMessage). undefined means
  // there's no length-bounded task to show a bar for right now -- never
  // "0%" -- so ServiceStatusView only ever draws a progress bar when
  // there's real progress to report.
  progress?: number;
}

export type ServiceStatusListener = (statuses: readonly ServiceStatus[]) => void;

/** A small observable registry of ServiceStatus rows -- one board is
 * shared by the LoadingScreen (blocks on it while `state !== "done"`
 * for the Services that matter) and the persistent ServiceStatusView
 * panel (keeps showing it afterwards), so both read the exact same live
 * state rather than each keeping their own copy. */
export class ServiceStatusBoard {
  private readonly statuses = new Map<string, ServiceStatus>();
  private readonly listeners = new Set<ServiceStatusListener>();

  register(id: string, label: string, state: ServiceState = "idle", detail?: string): void {
    this.statuses.set(id, { id, label, state, detail });
    this.notify();
  }

  // `progress` is replaced wholesale (undefined clears it), not merged
  // with whatever the previous update carried -- a status update that
  // doesn't mention progress means "no progress to report right now"
  // (e.g. seedWordNet's own final "done" status), not "leave the old
  // bar showing".
  update(id: string, state: ServiceState, detail?: string, progress?: number): void {
    const existing = this.statuses.get(id);
    if (!existing) return;
    this.statuses.set(id, { ...existing, state, detail, progress });
    this.notify();
  }

  get(id: string): ServiceStatus | undefined {
    return this.statuses.get(id);
  }

  all(): readonly ServiceStatus[] {
    return [...this.statuses.values()];
  }

  /** Calls `listener` immediately with the current snapshot, then again
   * on every future change. Returns an unsubscribe function. */
  subscribe(listener: ServiceStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.all());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.all();
    for (const listener of this.listeners) listener(snapshot);
  }
}
