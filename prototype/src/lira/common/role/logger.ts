import type { LogEvent, LogLevel } from "../data/log_event";

/** Where a `Logger`'s own emitted `LogEvent`s actually go -- a plain
 * callback rather than a direct `LogEventBoard` dependency, since a
 * `Logger` constructed inside a Web Worker (vocabulary_worker.ts's own
 * WordSeeder call sites) has no `LogEventBoard` of its own to append to
 * at all: its sink is `ctx.postMessage`, crossing the Worker boundary
 * the same way a `StatusMessage` already does (vocabulary_worker_protocol.ts).
 * A main-thread caller's sink is simply `(event) => board.append(event)`.
 * Either way, `Logger` itself never knows or cares which. */
export type LogSink = (event: LogEvent) => void;

/** Logger: the one place calling code (WordSeeder today,
 * role/word_seeder.ts's own `logger?:` parameters) turns "something
 * happened worth recording" into a real, timestamped `LogEvent` and
 * hands it to wherever it should end up -- a local `LogEventBoard` on
 * the main thread, or relayed across a Web Worker boundary via
 * `postMessage` -- without either the caller or `Logger` itself needing
 * to know which. `source` is bound once at construction (e.g. "Vocabulary
 * Service"), not passed per call, matching `ServiceStatus.label`'s own
 * "one row per named Service" shape -- every call site logging through
 * one `Logger` instance is already logging on behalf of the same named
 * source, not choosing a source per message. */
export class Logger {
  constructor(
    private readonly source: string,
    private readonly sink: LogSink,
  ) {}

  info(message: string): void {
    this.emit("info", message);
  }

  warn(message: string): void {
    this.emit("warn", message);
  }

  error(message: string): void {
    this.emit("error", message);
  }

  private emit(level: LogLevel, message: string): void {
    this.sink({ timestamp: Date.now(), level, source: this.source, message });
  }
}
