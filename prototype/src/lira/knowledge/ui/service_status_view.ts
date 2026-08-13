import type { ServiceState, ServiceStatus, ServiceStatusBoard } from "../data/service_status";

/** One row's optional attached action -- e.g. "Load WordNet" on the
 * Vocabulary Service row (PortalShell's own construction). Generic
 * (Knowledge doesn't know what WordNet is), matched to a row purely by
 * `id === ServiceStatus.id`; a row with no matching action renders
 * without a button at all. The button is automatically disabled while
 * that row's own `state === "running"` -- there's no separate
 * caller-managed disabled flag, since "this row's background task is
 * currently running" is already exactly the condition an action
 * button attached to it should be unavailable for. */
export interface ServiceStatusAction {
  id: string;
  label: string;
  onClick: () => void;
}

/** ServiceStatusView: a real, persistent UI Component showing every
 * registered Service's live status (Vocabulary Service running in a Web
 * Worker today; Linguistic/Knowledge Service rows shown as
 * "Not ported yet" until they exist) -- the browser-tab equivalent of a
 * server-status dashboard, since a Service here is a Web Worker rather
 * than a server process. Subscribes to a ServiceStatusBoard and
 * re-renders on every change; the same board the LoadingScreen watches
 * during startup keeps driving this panel afterwards. A row with
 * `progress` set (ServiceStatus's own docstring) additionally renders a
 * filling progress bar beneath it, e.g. WordSeeder.seedWordNet's own
 * synset-by-synset run relayed live through the Vocabulary Service
 * worker.
 *
 * Minimizable: a chevron in the header row collapses the rows down to
 * just that header (which then shows a "N/M running" summary in place
 * of the hidden rows, so collapsing never hides an error silently).
 * `collapsed` lives on this instance, not in the DOM the board
 * re-renders into -- PortalShell rebuilds this view's container from
 * scratch on every one of its own re-renders (selecting a Domain,
 * switching component, etc.), so an instance field is what makes the
 * collapsed state survive that instead of silently resetting to
 * expanded on the next unrelated Portal action. */
export class ServiceStatusView {
  private unsubscribe: (() => void) | undefined;
  private collapsed = false;

  constructor(
    private readonly board: ServiceStatusBoard,
    private readonly actions: readonly ServiceStatusAction[] = [],
  ) {}

  mount(container: HTMLElement): void {
    this.ensureStyles();
    this.unsubscribe?.();
    container.addEventListener("click", (event) => this.handleClick(event, container));
    this.unsubscribe = this.board.subscribe((statuses) => {
      container.innerHTML = this.renderPanel(statuses);
    });
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private handleClick(event: MouseEvent, container: HTMLElement): void {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target || (target as HTMLButtonElement).disabled) return;

    if (target.dataset.action === "toggle") {
      this.collapsed = !this.collapsed;
      container.innerHTML = this.renderPanel(this.board.all());
    } else if (target.dataset.action === "run") {
      const action = this.actions.find((a) => a.id === target.dataset.actionId);
      action?.onClick();
    }
  }

  private renderPanel(statuses: readonly ServiceStatus[]): string {
    const runningCount = statuses.filter((status) => status.state === "running" || status.state === "done").length;
    return `
      <div class="service-status-panel ${this.collapsed ? "collapsed" : ""}">
        <button type="button" class="service-status-header" data-action="toggle" aria-expanded="${!this.collapsed}">
          <span class="service-status-label">Background Services</span>
          ${this.collapsed ? `<span class="service-status-summary">${runningCount}/${statuses.length} running</span>` : ""}
          <span class="service-status-chevron">${ICON_CHEVRON}</span>
        </button>
        <div class="service-status-rows">
          ${statuses.map((status) => this.renderRow(status)).join("")}
        </div>
      </div>
    `;
  }

  private renderRow(status: ServiceStatus): string {
    const action = this.actions.find((a) => a.id === status.id);
    const progressBar =
      status.progress !== undefined
        ? `<div class="service-status-progress"><div class="service-status-progress-fill" style="width:${Math.round(status.progress * 100)}%"></div></div>`
        : "";
    return `
      <div class="service-status-row-group">
        <div class="service-status-row state-${status.state}">
          <span class="service-status-dot"></span>
          <span class="service-status-name">${escapeHtml(status.label)}</span>
          <span class="service-status-pill">${STATE_LABEL[status.state]}</span>
          ${status.detail ? `<span class="service-status-detail">${escapeHtml(status.detail)}</span>` : ""}
          ${
            action
              ? `<button type="button" class="service-status-action" data-action="run" data-action-id="${escapeHtml(action.id)}" ${status.state === "running" ? "disabled" : ""}>${escapeHtml(action.label)}</button>`
              : ""
          }
        </div>
        ${progressBar}
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

const ICON_CHEVRON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>`;

const STYLE_ID = "lira-service-status-styles";
const CSS = `
.service-status-panel {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: var(--surface, #FFFFFF);
  border-top: 1px solid var(--line, #DDE0DA);
  padding: 0.6rem 0.9rem 0.75rem;
}
.service-status-header {
  display: flex; align-items: center; gap: 0.5rem; width: 100%;
  background: none; border: none; padding: 0; margin-bottom: 0.45rem;
  font-family: inherit; cursor: pointer; text-align: left;
}
.service-status-label {
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 0.64rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint, #8B948E);
}
.service-status-summary { font-size: 0.72rem; color: var(--ink-muted, #5B6660); flex: 1; }
.service-status-chevron { display: flex; margin-left: auto; color: var(--ink-faint, #8B948E); transition: transform 0.15s ease; }
.service-status-chevron svg { width: 12px; height: 12px; }
.service-status-panel.collapsed .service-status-header { margin-bottom: 0; }
.service-status-panel.collapsed .service-status-chevron { transform: rotate(-90deg); }
.service-status-panel.collapsed .service-status-rows { display: none; }
.service-status-header:focus-visible { outline: 2px solid var(--accent, #2B6E63); outline-offset: 2px; }
.service-status-rows { display: flex; flex-direction: column; gap: 0.4rem; }
.service-status-row-group { display: flex; flex-direction: column; gap: 0.25rem; }
.service-status-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--ink, #1C2321); }
.service-status-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: var(--ink-faint, #8B948E); }
.service-status-name { min-width: 148px; }
.service-status-pill {
  font-size: 0.66rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase;
  padding: 0.08rem 0.45rem; border-radius: 999px; color: var(--ink-muted, #5B6660);
  background: var(--surface-2, #ECEEE8); flex: none;
}
.service-status-detail { color: var(--ink-muted, #5B6660); font-size: 0.76rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.service-status-action {
  font-family: inherit; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.01em;
  border: 1px solid var(--line-strong, #C4C9BF); background: var(--surface, #FFFFFF); color: var(--accent, #2B6E63);
  padding: 0.15rem 0.55rem; border-radius: 999px; cursor: pointer; flex: none; margin-left: auto;
}
.service-status-action:hover:not(:disabled) { background: var(--accent-soft, #DCE9E4); }
.service-status-action:disabled { cursor: not-allowed; opacity: 0.5; }
.service-status-action:focus-visible { outline: 2px solid var(--accent, #2B6E63); outline-offset: 1px; }
.service-status-progress {
  height: 4px; border-radius: 999px; background: var(--surface-2, #ECEEE8); overflow: hidden;
  margin-left: 15px; /* aligns the bar's left edge under the dot's name column, not the dot itself */
}
.service-status-progress-fill {
  height: 100%; background: var(--accent, #2B6E63); border-radius: 999px;
  transition: width 0.2s ease-out;
}
.service-status-row.state-running .service-status-dot { background: var(--accent, #2B6E63); animation: lira-pulse 1.4s ease-in-out infinite; }
.service-status-row.state-running .service-status-pill { background: var(--accent-soft, #DCE9E4); color: var(--accent, #2B6E63); }
.service-status-row.state-done .service-status-dot { background: var(--accent, #2B6E63); }
.service-status-row.state-done .service-status-pill { background: var(--accent-soft, #DCE9E4); color: var(--accent, #2B6E63); }
.service-status-row.state-error .service-status-dot { background: #C2544B; }
.service-status-row.state-error .service-status-pill { background: rgba(194, 84, 75, 0.15); color: #C2544B; }
.service-status-row.state-not-ported { opacity: 0.55; }
@media (prefers-reduced-motion: reduce) { .service-status-dot { animation: none !important; } .service-status-progress-fill { transition: none; } }
@keyframes lira-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
`;
