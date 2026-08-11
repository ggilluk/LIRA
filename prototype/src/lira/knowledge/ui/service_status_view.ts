import type { ServiceState, ServiceStatus, ServiceStatusBoard } from "../data/service_status";

/** ServiceStatusView: a real, persistent UI Component showing every
 * registered Service's live status (Vocabulary Service running in a Web
 * Worker today; Linguistic/Knowledge Service rows shown as
 * "Not ported yet" until they exist) -- the browser-tab equivalent of a
 * server-status dashboard, since a Service here is a Web Worker rather
 * than a server process. Subscribes to a ServiceStatusBoard and
 * re-renders on every change; the same board the LoadingScreen watches
 * during startup keeps driving this panel afterwards. */
export class ServiceStatusView {
  private unsubscribe: (() => void) | undefined;

  constructor(private readonly board: ServiceStatusBoard) {}

  mount(container: HTMLElement): void {
    this.ensureStyles();
    this.unsubscribe?.();
    this.unsubscribe = this.board.subscribe((statuses) => {
      container.innerHTML = this.renderPanel(statuses);
    });
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private renderPanel(statuses: readonly ServiceStatus[]): string {
    return `
      <div class="service-status-panel">
        <div class="service-status-label">Background Services</div>
        <div class="service-status-rows">
          ${statuses.map((status) => this.renderRow(status)).join("")}
        </div>
      </div>
    `;
  }

  private renderRow(status: ServiceStatus): string {
    return `
      <div class="service-status-row state-${status.state}">
        <span class="service-status-dot"></span>
        <span class="service-status-name">${escapeHtml(status.label)}</span>
        <span class="service-status-pill">${STATE_LABEL[status.state]}</span>
        ${status.detail ? `<span class="service-status-detail">${escapeHtml(status.detail)}</span>` : ""}
      </div>
    `;
  }

  private ensureStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
}

const STATE_LABEL: Record<ServiceState, string> = {
  "not-ported": "Not ported",
  idle: "Idle",
  running: "Running",
  done: "Running",
  error: "Error",
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const STYLE_ID = "lira-service-status-styles";
const CSS = `
.service-status-panel {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: var(--surface, #FFFFFF);
  border-top: 1px solid var(--line, #DDE0DA);
  padding: 0.6rem 0.9rem 0.75rem;
}
.service-status-label {
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 0.64rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint, #8B948E);
  margin-bottom: 0.45rem;
}
.service-status-rows { display: flex; flex-direction: column; gap: 0.3rem; }
.service-status-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--ink, #1C2321); }
.service-status-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: var(--ink-faint, #8B948E); }
.service-status-name { min-width: 148px; }
.service-status-pill {
  font-size: 0.66rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase;
  padding: 0.08rem 0.45rem; border-radius: 999px; color: var(--ink-muted, #5B6660);
  background: var(--surface-2, #ECEEE8); flex: none;
}
.service-status-detail { color: var(--ink-muted, #5B6660); font-size: 0.76rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.service-status-row.state-running .service-status-dot { background: var(--accent, #2B6E63); animation: lira-pulse 1.4s ease-in-out infinite; }
.service-status-row.state-running .service-status-pill { background: var(--accent-soft, #DCE9E4); color: var(--accent, #2B6E63); }
.service-status-row.state-done .service-status-dot { background: var(--accent, #2B6E63); }
.service-status-row.state-done .service-status-pill { background: var(--accent-soft, #DCE9E4); color: var(--accent, #2B6E63); }
.service-status-row.state-error .service-status-dot { background: #C2544B; }
.service-status-row.state-error .service-status-pill { background: rgba(194, 84, 75, 0.15); color: #C2544B; }
.service-status-row.state-not-ported { opacity: 0.55; }
@media (prefers-reduced-motion: reduce) { .service-status-dot { animation: none !important; } }
@keyframes lira-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
`;
