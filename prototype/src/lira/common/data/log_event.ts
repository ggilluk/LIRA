/** One structured log entry, as emitted by `common/role/logger.ts`'s
 * `Logger` and collected by `LogEventBoard` below -- the "what happened,
 * and when" counterpart to `service_status.ts`'s own "what's happening
 * right now" `ServiceStatus` row. A `ServiceStatus` row is overwritten
 * in place (one row per Service, always showing its current state); a
 * `LogEvent` is never overwritten -- it's an appended, timestamped
 * history entry, many per Service over a session. */
export type LogLevel = "info" | "warn" | "error";

export interface LogEvent {
  /** `Date.now()` at the moment this event was emitted -- wall-clock
   * time, not a monotonic counter, since the Event Log viewer
   * (`common/ui/service_status_view.ts`) shows it to a person as a
   * clock time, not a sequence number (`id` below is what ordering/
   * dedup actually needs). */
  timestamp: number;
  level: LogLevel;
  /** The Service/component that emitted this event (e.g. "Vocabulary
   * Service", `Logger`'s own `source` -- bound once per `Logger`
   * instance, not passed per call, since every call through one
   * `Logger` already speaks for the same named source). */
  source: string;
  message: string;
}

export type LogEventListener = (events: readonly LogEvent[]) => void;

/** A generous cap on how many events the Event Log viewer keeps around
 * -- a real WordNet seed alone emits only a handful (start/pass-1-done/
 * pass-2-done/finish, word_seeder.ts's own logger calls), so this is a
 * safety bound against an unexpectedly chatty future source, not a
 * capacity this codebase's own current callers ever approach. Oldest
 * events drop off the front once exceeded -- `LogEventBoard` is a live
 * viewer's own backing store, not a durable audit log. */
const MAX_LOG_EVENTS = 300;

/** A small observable append-only log -- `ServiceStatusBoard`'s own
 * "board" pattern (`service_status.ts`), one level more detailed: many
 * `LogEvent` rows accumulate over a session instead of one `ServiceStatus`
 * row being overwritten in place. Shared the same way `ServiceStatusBoard`
 * is -- one board constructed on the main thread (`main.ts`), fed by
 * every Service worker's own relayed log messages (e.g.
 * `VocabularyWorkerClient.onLog()`), read by the persistent
 * `ServiceStatusView` panel's own Event Log section. */
export class LogEventBoard {
  private readonly events: LogEvent[] = [];
  private readonly listeners = new Set<LogEventListener>();

  append(event: LogEvent): void {
    this.events.push(event);
    if (this.events.length > MAX_LOG_EVENTS) this.events.shift();
    this.notify();
  }

  all(): readonly LogEvent[] {
    return [...this.events];
  }

  /** Calls `listener` immediately with the current snapshot, then again
   * on every future `append()` -- `ServiceStatusBoard.subscribe()`'s own
   * exact shape. Returns an unsubscribe function. */
  subscribe(listener: LogEventListener): () => void {
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
