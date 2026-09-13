import type { ServiceState, ServiceStatus, ServiceStatusBoard } from "../data/service_status";

/** LoadingScreen: a real UI Component -- the "LIRA Initialising" box.
 * Mounts immediately (before any Service has done any work) and paints
 * a live checklist driven by the same ServiceStatusBoard the
 * ServiceStatusView panel reads afterwards, so the first thing the page
 * shows is honest progress instead of a blank frame while the
 * Vocabulary Service seeds ~3,100 words and ~6,100 relationships inside
 * its worker. `waitFor(...ids)` resolves once every named Service
 * reaches a terminal state (`done` or `error`) -- Services the caller
 * doesn't list (Linguistics, Knowledge -- permanently `"not-ported"`)
 * are still shown in the checklist, just never block on. */
export class LoadingScreen {
  private unsubscribe: (() => void) | undefined;

  constructor(
    private readonly board: ServiceStatusBoard,
    private readonly title = "LIRA",
  ) {}

  mount(container: HTMLElement): void {
    this.ensureStyles();
    this.unsubscribe?.();
    this.unsubscribe = this.board.subscribe((statuses) => {
      container.innerHTML = this.renderScreen(statuses);
    });
  }

  /** Resolves once every Service in `ids` reaches `done` or `error`. */
  waitFor(...ids: readonly string[]): Promise<void> {
    return new Promise((resolve) => {
      const isSettled = (state: ServiceState) => state === "done" || state === "error";
      const check = (statuses: readonly ServiceStatus[]) => {
        const tracked = statuses.filter((status) => ids.includes(status.id));
        if (tracked.length === ids.length && tracked.every((status) => isSettled(status.state))) {
          unsubscribe();
          resolve();
        }
      };
      const unsubscribe = this.board.subscribe(check);
    });
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private renderScreen(statuses: readonly ServiceStatus[]): string {
    return `
      <div class="loading-screen">
        <div class="loading-box">
          <div class="loading-title">${escapeHtml(this.title)}</div>
          <div class="loading-subtitle">Initialising…</div>
          <div class="loading-steps">
            ${statuses.map((status) => this.renderStep(status)).join("")}
          </div>
        </div>
      </div>
    `;
  }

  private renderStep(status: ServiceStatus): string {
    return `
      <div class="loading-step state-${status.state}">
        <span class="loading-step-icon">${ICON[status.state]}</span>
        <span class="loading-step-label">${escapeHtml(status.label)}</span>
        <span class="loading-step-detail">${escapeHtml(status.detail ?? DEFAULT_DETAIL[status.state])}</span>
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

const DEFAULT_DETAIL: Record<ServiceState, string> = {
  "not-ported": "Not ported yet",
  idle: "Waiting…",
  running: "Working…",
  done: "Ready",
  error: "Failed",
};

const ICON: Record<ServiceState, string> = {
  "not-ported": "–",
  idle: "○",
  running: `<span class="loading-spinner"></span>`,
  done: "✓",
  error: "✕",
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const STYLE_ID = "lira-loading-screen-styles";
const CSS = `
.loading-screen {
  --ground: #F4F5F1; --surface: #FFFFFF; --ink: #1C2321; --ink-muted: #5B6660; --ink-faint: #8B948E;
  --accent: #2B6E63; --line: #DDE0DA; --line-strong: #C4C9BF;
  height: 100%; display: flex; align-items: center; justify-content: center;
  background: var(--ground);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: var(--ink);
}
@media (prefers-color-scheme: dark) {
  .loading-screen {
    --ground: #12211D; --surface: #182A24; --ink: #E7EEEA; --ink-muted: #90A69D; --ink-faint: #5E7A70;
    --accent: #4FBBA6; --line: #2A3B34; --line-strong: #3B4F47;
  }
}
.loading-box {
  width: min(420px, 90vw);
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  padding: 1.5rem 1.6rem;
  box-shadow: 0 1px 2px rgba(28,35,33,0.07), 0 10px 28px rgba(28,35,33,0.10);
}
.loading-title { font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif; font-size: 1.4rem; font-weight: 500; }
.loading-subtitle { font-size: 0.82rem; color: var(--ink-muted); margin-top: 0.15rem; margin-bottom: 1.1rem; }
.loading-steps { display: flex; flex-direction: column; gap: 0.55rem; }
.loading-step { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; }
.loading-step-icon { width: 18px; flex: none; text-align: center; color: var(--ink-faint); font-size: 0.85rem; }
.loading-step-label { min-width: 132px; }
.loading-step-detail { color: var(--ink-muted); font-size: 0.78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.loading-step.state-running .loading-step-label { font-weight: 600; }
.loading-step.state-done .loading-step-icon { color: var(--accent); }
.loading-step.state-error .loading-step-icon { color: #C2544B; }
.loading-step.state-not-ported { opacity: 0.5; }
.loading-spinner {
  display: inline-block; width: 11px; height: 11px; border-radius: 50%;
  border: 1.6px solid var(--line-strong); border-top-color: var(--accent);
  animation: lira-spin 0.8s linear infinite;
}
@media (prefers-reduced-motion: reduce) { .loading-spinner { animation: none; } }
@keyframes lira-spin { to { transform: rotate(360deg); } }
`;
