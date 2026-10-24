import type { ConsoleCommand, ConsoleServices, MetricsProvider } from "./types";
import type { ServiceState, ServiceStatus } from "../../data/service_status";
import { formatBytes } from "./shared";

const STATE_LABEL: Record<ServiceState, string> = {
  "not-ported": "NOT PORTED",
  idle: "IDLE",
  running: "RUNNING",
  done: "DONE",
  error: "ERROR",
};

/** `status.id` -> the real `MetricsProvider` that Service's own data
 * actually comes from -- `"knowledge"` has no entry at all, the same
 * "not ported" reality `ServiceStatusBoard.register("knowledge", ...,
 * "not-ported")` already states (main.ts): there's no Worker behind it
 * for `ps` to ask anything of. */
function providerFor(id: string, services: ConsoleServices): MetricsProvider | undefined {
  if (id === "vocabulary") return services.vocabularyClient;
  if (id === "linguistics") return services.linguisticsClient;
  return undefined;
}

/** `ps aux`'s own shape, for the Services this Portal actually runs --
 * CPU time has no column here at all, not a blank one: no browser API
 * exposes per-thread CPU usage to JS, so there's no honest number any
 * column could show (`WorkerMetrics`'s own docstring,
 * vocabulary_worker_protocol.ts, makes the same call). `UPTIME`/`HEAP`/
 * `%HEAP` come from a real round-trip to each Service's own Worker
 * (`MetricsProvider.getMetrics()`) -- not cached, not estimated, asked
 * fresh every time `ps` runs, the same as a real `ps` reading `/proc`
 * fresh on every invocation. A Service with no live Worker behind it
 * (`"not-ported"`, `providerFor()`'s own docstring) shows `-` across the
 * board; a live Worker-backed Service shows `-` for HEAP/%HEAP too,
 * because `performance.memory` is `undefined` inside a dedicated
 * Worker's own global scope in every browser tested so far (confirmed
 * by direct probe even in Chrome, which has it on the main thread) --
 * whichever column has nothing honest to report shows `-`, never a
 * guessed number. */
export const psCommand: ConsoleCommand = {
  name: "ps",
  description: "list running Services with live memory metrics",
  run: async ({ services }) => {
    const statuses = services.statusBoard.all();
    const metricsById = new Map<string, { uptimeMs: number; heapUsedBytes?: number; heapLimitBytes?: number }>();
    await Promise.all(
      statuses.map(async (status) => {
        const provider = providerFor(status.id, services);
        if (!provider) return;
        try {
          metricsById.set(status.id, await provider.getMetrics());
        } catch {
          // Left unset -- the row below shows "-" for every metrics
          // column, the same "a failed operand doesn't block the rest"
          // treatment ps's own sibling commands already give a single
          // bad path (shared.ts's own forEachOperand()).
        }
      }),
    );

    const header = "PID   SERVICE               STATE        UPTIME     HEAP          %HEAP";
    const rows = statuses.map((status, index) => formatRow(index + 1, status, metricsById.get(status.id)));
    return [header, ...rows];
  },
};

function formatRow(pid: number, status: ServiceStatus, metrics: { uptimeMs: number; heapUsedBytes?: number; heapLimitBytes?: number } | undefined): string {
  const uptime = metrics ? formatUptime(metrics.uptimeMs) : "-";
  const heap = metrics?.heapUsedBytes !== undefined && metrics.heapLimitBytes !== undefined ? `${formatBytes(metrics.heapUsedBytes)}/${formatBytes(metrics.heapLimitBytes)}` : "-";
  const heapPercent = metrics?.heapUsedBytes !== undefined && metrics.heapLimitBytes ? `${Math.round((metrics.heapUsedBytes / metrics.heapLimitBytes) * 100)}%` : "-";
  return `${String(pid).padEnd(6)}${status.label.padEnd(22)}${STATE_LABEL[status.state].padEnd(13)}${uptime.padEnd(11)}${heap.padEnd(14)}${heapPercent}`;
}

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}
