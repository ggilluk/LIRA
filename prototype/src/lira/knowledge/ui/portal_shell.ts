import { DictionaryView } from "../../vocabulary/ui/dictionary_view";
import type { PortalDomain, PortalDomainRegistry } from "../data/portal_domain";

/** PortalShell: a Windows-Explorer-style desktop shell that switches to
 * a drill-down mobile portal -- the folder tree is the Domain hierarchy
 * (root is "All Domains"; nesting follows each PortalDomain's own
 * `parentName`), and the pane beside it mounts a ported UI component
 * for whichever Domain is selected (DictionaryView today; a Domain
 * with more than one ported layer would get its own tabs here the same
 * way DictionaryView's Words/Relationships/Hierarchy/Cyclic tabs work
 * inside one view).
 *
 * This is the real shell the mockup ("LIRA Portal Shell -- Explorer
 * Concept") sketched, not a mockup itself -- every control here is a
 * live event listener, and the view pane mounts a genuine
 * `DictionaryView.render()` output (a self-contained HTML document) in
 * an `<iframe srcdoc>`, the same embedding this prototype's `main.ts`
 * already uses and the same reason: `render()` returns its own
 * `<!DOCTYPE>`/`<head>`/`<script>`, which innerHTML would both mangle
 * and silently refuse to execute.
 *
 * Token names (`--ground`, `--surface`, `--ink`, `--accent`, `--line`,
 * `--line-strong`, `--shadow`) match vocabulary/ui/dictionary_view.py's
 * own `_PAGE_TEMPLATE` `:root` block exactly, so the shell's chrome and
 * the DictionaryView it frames read as one system rather than two
 * different applications glued together. */

type ShellMode = "desktop" | "mobile";
type MobileScreen = "browse" | "view";

export interface PortalShellOptions {
  title?: string;
}

const STYLE_ELEMENT_ID = "lira-portal-shell-styles";

export class PortalShell {
  private mode: ShellMode;
  private mobileScreen: MobileScreen = "browse";
  private selectedName: string | undefined;
  private readonly title: string;
  private readonly viewCache = new Map<string, string>();
  private container: HTMLElement | undefined;

  constructor(private readonly registry: PortalDomainRegistry, options: PortalShellOptions = {}) {
    this.title = options.title ?? "LIRA";
    this.mode = typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches ? "mobile" : "desktop";
    this.selectedName = this.registry.roots()[0]?.name;
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.ensureStyles();
    container.addEventListener("click", (event) => this.handleClick(event));
    this.render();
  }

  private handleClick(event: MouseEvent): void {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target) return;
    const action = target.dataset.action;

    if (action === "select") {
      this.selectedName = target.dataset.domain;
      if (this.mode === "mobile") this.mobileScreen = "view";
      this.render();
    } else if (action === "mode") {
      this.mode = target.dataset.mode as ShellMode;
      if (this.mode === "mobile") this.mobileScreen = this.selectedName ? "view" : "browse";
      this.render();
    } else if (action === "back") {
      this.mobileScreen = "browse";
      this.render();
    }
  }

  private ensureStyles(): void {
    if (document.getElementById(STYLE_ELEMENT_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    style.textContent = SHELL_CSS;
    document.head.appendChild(style);
  }

  private viewHtmlFor(domain: PortalDomain): string {
    const cached = this.viewCache.get(domain.name);
    if (cached !== undefined) return cached;
    const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.lexicalRelationships, {
      title: `${this.title} — ${domain.name}`,
      domainName: domain.name,
    });
    const html = view.render();
    this.viewCache.set(domain.name, html);
    return html;
  }

  private render(): void {
    if (!this.container) return;
    const selected = this.selectedName ? this.registry.get(this.selectedName) : undefined;

    this.container.innerHTML = `
      <div class="portal-shell mode-${this.mode}">
        ${this.renderTopbar(selected)}
        <div class="portal-body">
          ${this.renderBody(selected)}
        </div>
      </div>
    `;

    if (selected) {
      const frame = this.container.querySelector<HTMLIFrameElement>(".portal-frame");
      if (frame) frame.srcdoc = this.viewHtmlFor(selected);
    }
  }

  private renderTopbar(selected: PortalDomain | undefined): string {
    const modeToggle = `
      <div class="portal-mode-toggle" role="group" aria-label="Layout">
        <button type="button" data-action="mode" data-mode="desktop" class="${this.mode === "desktop" ? "active" : ""}">${ICON_DESKTOP} Desktop</button>
        <button type="button" data-action="mode" data-mode="mobile" class="${this.mode === "mobile" ? "active" : ""}">${ICON_MOBILE} Mobile</button>
      </div>`;

    if (this.mode === "mobile") {
      if (this.mobileScreen === "view" && selected) {
        return `
          <div class="portal-topbar">
            <button type="button" class="portal-back" data-action="back" aria-label="Back to Domains">${ICON_BACK}</button>
            <span class="portal-topbar-title">${escapeHtml(selected.name)}</span>
            ${modeToggle}
          </div>`;
      }
      return `<div class="portal-topbar"><span class="portal-topbar-title">All Domains</span>${modeToggle}</div>`;
    }

    const crumbs = selected ? this.registry.ancestryOf(selected.name) : [];
    const crumbHtml = [`<span class="crumb-root">${ICON_HOME} All Domains</span>`, ...crumbs.map((d) => `<span>${escapeHtml(d.name)}</span>`)]
      .join(`<span class="crumb-sep">${ICON_CHEVRON}</span>`);
    return `<div class="portal-topbar"><nav class="portal-breadcrumb">${crumbHtml}</nav>${modeToggle}</div>`;
  }

  private renderBody(selected: PortalDomain | undefined): string {
    if (this.mode === "desktop") {
      return `${this.renderTree()}${this.renderViewPane(selected)}`;
    }
    if (this.mobileScreen === "browse") {
      return `<div class="portal-tree portal-tree--mobile">${this.renderTreeRows(0)}</div>`;
    }
    return this.renderViewPane(selected, true);
  }

  private renderTree(): string {
    return `<nav class="portal-tree"><div class="portal-tree-label">Domains</div>${this.renderTreeRows(0)}</nav>`;
  }

  private renderTreeRows(depth: number, parentName?: string): string {
    const domains = depth === 0 ? this.registry.roots() : this.registry.children(parentName ?? "");
    return domains
      .map((domain) => {
        const kids = this.registry.children(domain.name);
        const selected = domain.name === this.selectedName;
        const wordCount = domain.vocabulary.dictionary.totalEntries();
        return `
          <div class="portal-tree-row depth-${depth} ${selected ? "selected" : ""}" data-action="select" data-domain="${escapeHtml(domain.name)}">
            ${kids.length > 0 ? ICON_CHEVRON_DOWN : `<span class="chev-spacer"></span>`}
            ${ICON_FOLDER}
            <span class="name">${escapeHtml(domain.name)}</span>
            <span class="count">${wordCount.toLocaleString()}</span>
          </div>
          ${kids.length > 0 ? this.renderTreeRows(depth + 1, domain.name) : ""}
        `;
      })
      .join("");
  }

  private renderViewPane(selected: PortalDomain | undefined, fullWidth = false): string {
    if (!selected) {
      return `<div class="portal-view portal-view-empty">Select a Domain to open its Vocabulary.</div>`;
    }
    return `
      <div class="portal-view ${fullWidth ? "portal-view--full" : ""}">
        <iframe class="portal-frame" title="${escapeHtml(selected.name)} — Vocabulary"></iframe>
      </div>`;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const ICON_FOLDER = `<svg class="i-folder" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.6l1.2 1.4H13.5A1 1 0 0 1 14.5 5v7A1 1 0 0 1 13.5 13h-11a1 1 0 0 1-1-1v-8.5z"/></svg>`;
const ICON_CHEVRON_DOWN = `<svg class="i-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>`;
const ICON_CHEVRON = `<svg class="i-chev-right" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>`;
const ICON_HOME = `<svg class="i-home" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 8l6-5 6 5M4 7v6h8V7"/></svg>`;
const ICON_BACK = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>`;
const ICON_DESKTOP = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.5" y="2.5" width="13" height="9" rx="1"/><path d="M6 13.5h4"/></svg>`;
const ICON_MOBILE = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4.5" y="1.5" width="7" height="13" rx="1.4"/></svg>`;

const SHELL_CSS = `
.portal-shell {
  --ground: #F4F5F1; --surface: #FFFFFF; --surface-2: #ECEEE8; --ink: #1C2321; --ink-muted: #5B6660;
  --ink-faint: #8B948E; --accent: #2B6E63; --accent-ink: #FFFFFF; --accent-soft: #DCE9E4;
  --line: #DDE0DA; --line-strong: #C4C9BF;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}
@media (prefers-color-scheme: dark) {
  .portal-shell {
    --ground: #12211D; --surface: #182A24; --surface-2: #16241F; --ink: #E7EEEA; --ink-muted: #90A69D;
    --ink-faint: #5E7A70; --accent: #4FBBA6; --accent-ink: #0B1613; --accent-soft: #1F3A32;
    --line: #2A3B34; --line-strong: #3B4F47;
  }
}
.portal-topbar { display: flex; align-items: center; gap: 0.75rem; padding: 0.55rem 0.9rem; background: var(--surface-2); border-bottom: 1px solid var(--line); }
.portal-topbar-title { font-weight: 600; font-size: 0.92rem; flex: 1; }
.portal-back { background: none; border: none; color: var(--accent); cursor: pointer; padding: 0.2rem; display: flex; }
.portal-back svg { width: 16px; height: 16px; }
.portal-breadcrumb { display: flex; align-items: center; gap: 0.35rem; font-family: 'SF Mono', Menlo, monospace; font-size: 0.78rem; color: var(--ink-muted); flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; }
.portal-breadcrumb .crumb-root { display: inline-flex; align-items: center; gap: 0.3rem; color: var(--ink); font-weight: 600; }
.portal-breadcrumb .crumb-root svg { width: 11px; height: 11px; }
.portal-breadcrumb .crumb-sep svg { width: 9px; height: 9px; opacity: 0.6; vertical-align: -1px; }
.portal-mode-toggle { display: inline-flex; border: 1px solid var(--line-strong); border-radius: 999px; overflow: hidden; flex: none; }
.portal-mode-toggle button { display: inline-flex; align-items: center; gap: 0.3rem; border: none; background: var(--surface); color: var(--ink-muted); font-size: 0.72rem; font-weight: 600; padding: 0.3rem 0.65rem; cursor: pointer; font-family: inherit; }
.portal-mode-toggle button svg { width: 13px; height: 13px; }
.portal-mode-toggle button.active { background: var(--accent); color: var(--accent-ink); }
.portal-mode-toggle button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.portal-body { display: grid; grid-template-columns: 208px 1fr; flex: 1; min-height: 0; }
.mode-mobile .portal-body { grid-template-columns: 1fr; }
.portal-tree { background: var(--surface-2); border-right: 1px solid var(--line); padding: 0.75rem 0.5rem; overflow-y: auto; }
.portal-tree--mobile { border-right: none; padding: 0.5rem; }
.portal-tree-label { font-family: 'SF Mono', Menlo, monospace; font-size: 0.66rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint); padding: 0.2rem 0.55rem 0.5rem; }
.portal-tree-row { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.55rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer; }
.portal-tree-row:hover { background: var(--accent-soft); }
.portal-tree-row.selected { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.portal-tree-row.depth-1 { padding-left: 1.35rem; }
.portal-tree-row.depth-2 { padding-left: 2.3rem; }
.portal-tree-row .i-chev { width: 10px; height: 10px; color: var(--ink-faint); flex: none; }
.portal-tree-row .chev-spacer { width: 10px; flex: none; }
.portal-tree-row .i-folder { width: 15px; height: 15px; color: var(--accent); flex: none; }
.portal-tree-row .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.portal-tree-row .count { font-family: 'SF Mono', Menlo, monospace; font-size: 0.7rem; color: var(--ink-faint); }
.portal-view { display: flex; min-width: 0; }
.portal-view-empty { align-items: center; justify-content: center; color: var(--ink-muted); font-size: 0.88rem; padding: 2rem; }
.portal-frame { width: 100%; height: 100%; border: 0; flex: 1; background: var(--ground); min-height: 480px; }
.mode-mobile .portal-frame { min-height: 70vh; }
`;
