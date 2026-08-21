import type { ServiceStatus, ServiceStatusBoard } from "../data/service_status";
import type { PortalDomain, PortalDomainRegistry } from "../data/portal_domain";
import { ServiceStatusView } from "./service_status_view";
import type { VocabularyWorkerClient } from "../../vocabulary/role/web_worker/vocabulary_worker_client";
import type { RenderedFragment } from "../../vocabulary/role/web_worker/vocabulary_worker_protocol";
import type { LinguisticsWorkerClient } from "../../linguistics/role/web_worker/linguistics_worker_client";
import { SentenceReaderView } from "../../linguistics/ui/sentence_reader_view";

// Both Vocabulary toolbar seeding actions -- "Seed Vocabulary"
// (seedCommonVocabulary) and "Load WordNet" (seedWordNet) -- always
// target "Common" in practice (SeedCommonVocabularyRequest's and
// SeedWordNetRequest's own docstrings, vocabulary_worker_protocol.ts).
const SEED_TARGET_DOMAIN = "Common";

// Mirrors the "lira-search-words" CustomEvent's own `detail` shape --
// dictionary_view.ts's renderWordsOverCapacity() is the one place that
// dispatches it (a fragment's script has no reference to this shell or
// its VocabularyWorkerClient, only this event), see this file's own
// searchWordsBridge() docstring for the other end.
interface LiraSearchWordsEventDetail {
  requestId: string;
  wordId?: string;
  word?: string;
  gloss?: string;
  definition?: string;
  pos?: string;
  domain?: string;
  rootWordsOnly?: boolean;
  limit?: number;
}

// Mirrors the "lira-search-phrases" CustomEvent's own `detail` shape --
// dictionary_view.ts's renderPhrasesOverCapacity() is the one place
// that dispatches it, same reasoning as LiraSearchWordsEventDetail just
// above (minus wordId/domain/rootWordsOnly, which Phrase search has no
// use for -- SearchPhrasesRequest's own docstring, vocabulary_worker_protocol.ts).
interface LiraSearchPhrasesEventDetail {
  requestId: string;
  word?: string;
  gloss?: string;
  definition?: string;
  pos?: string;
  limit?: number;
}

// Mirrors the "lira-search-senses" CustomEvent's own `detail` shape --
// dictionary_view.ts's renderSensesOverCapacity() is the one place that
// dispatches it, same shape as LiraSearchPhrasesEventDetail just above
// (a Sense-uuid pivot lookup still goes through the shared
// LiraSearchWordsEventDetail/`wordId` path instead, DictionaryView.searchWords()'s
// own Senses fallback -- SearchSensesRequest's own docstring,
// vocabulary_worker_protocol.ts).
interface LiraSearchSensesEventDetail {
  requestId: string;
  word?: string;
  gloss?: string;
  definition?: string;
  pos?: string;
  limit?: number;
}

// Mirrors the "lira-search-relationships" CustomEvent's own `detail`
// shape -- dictionary_view.ts's renderRelsOverCapacity() (Relationships
// tab search) and renderDetailPanel() (a selected Word's own relationship
// list, over MAX_INTERACTIVE_WORDS) are the two places that dispatch it;
// see searchRelationshipsBridge()'s own docstring for the other end.
interface LiraSearchRelationshipsEventDetail {
  requestId: string;
  wordId?: string;
  query?: string;
  limit?: number;
}

// Mirrors the "lira-resolve-hierarchy" CustomEvent's own `detail` shape
// -- dictionary_view.ts's renderHierarchy() dispatches it whenever the
// target Domain is over MAX_INTERACTIVE_WORDS; see
// resolveHierarchyBridge()'s own docstring for the other end.
interface LiraResolveHierarchyEventDetail {
  requestId: string;
  kind: string;
  wordId?: string;
  limit?: number;
}

/** PortalShell: a Windows-Explorer-style desktop shell that switches to
 * a drill-down mobile portal -- the folder tree is the Domain hierarchy
 * (root is "All Domains"; nesting follows each PortalDomain's own
 * `parentName`), and the pane beside it hosts a component switcher
 * (Vocabulary / Linguistics / Knowledge -- one button per ported-or-not
 * Architectural Layer that has a UI component) mounting the selected
 * one's view for whichever Domain is picked. Vocabulary and Linguistics
 * are available today; Knowledge renders as a disabled tab rather than
 * disappearing, so the shell's own shape doesn't quietly imply LIRA
 * only ever has these two layers. Beneath the component switcher,
 * a `ServiceStatusView` shows the same Background Services the
 * LoadingScreen tracked during startup, still live.
 *
 * The Vocabulary view comes from a real `VocabularyWorkerClient` -- a
 * Web Worker running WordSeeder/RelationshipSeeder/DictionaryView off
 * the main thread (see vocabulary/role/web_worker/vocabulary_worker.ts) -- but
 * unlike this shell's first version, it's mounted by
 * *direct-DOM-composition*, not an `<iframe srcdoc>`: the worker
 * returns `DictionaryView.renderFragment()`'s three pieces (style/
 * body/script) instead of a full `render()` document, and this shell
 * injects them into its own DOM the same way the Python `LiraView`
 * combines DictionaryView with SentenceReaderView into one page. That
 * matters for two reasons an iframe couldn't give it: the fragment's
 * CSS inherits this shell's own `--ground`/`--surface`/`--accent`/etc.
 * tokens (defined once below, copied verbatim from
 * vocabulary/ui/dictionary_view.py's own `:root` block) instead of
 * laying out for a full browser window, and DictionaryView's own
 * masthead/title -- which `renderFragment()` excludes by design -- is
 * never in the picture to begin with; the Portal topbar's breadcrumb
 * is the only title the pane ever shows.
 *
 * The fragment's `<script>` still expects to run against a real,
 * already-in-the-DOM copy of its `body` (it does its own
 * `document.getElementById(...)` wiring) -- `loadView()` sets the body
 * HTML first, then executes the script via a real `<script>` element
 * (not `innerHTML`, which never executes injected scripts), wrapped in
 * its own IIFE so its top-level `const`s/`function`s can't collide
 * with a second fragment mounted later (or, one day, a sibling view's
 * own script mounted alongside it).
 *
 * The Linguistics view is different in kind, not just in content: it's
 * not a ported Python page being embedded, it's a new component
 * (linguistics/ui/sentence_reader_view.ts's `SentenceReaderView`) built
 * directly against this shell's own composition and a real
 * `LinguisticsWorkerClient` -- there is no fragment to inject and no
 * per-Domain routing (the Linguistics worker reads against its own
 * seeded Common vocabulary regardless of which Domain node is
 * selected); it just mounts itself into whatever container this shell
 * hands it. */

type ShellMode = "desktop" | "mobile";
type MobileScreen = "browse" | "view";
type ComponentId = "vocabulary" | "linguistics" | "knowledge";

interface ComponentDescriptor {
  id: ComponentId;
  label: string;
  available: boolean;
}

const COMPONENTS: readonly ComponentDescriptor[] = [
  { id: "vocabulary", label: "Vocabulary", available: true },
  { id: "linguistics", label: "Linguistics", available: true },
  { id: "knowledge", label: "Knowledge", available: false },
];

export interface PortalShellOptions {
  title?: string;
}

const STYLE_ELEMENT_ID = "lira-portal-shell-styles";
const FRAGMENT_STYLE_ELEMENT_ID = "lira-vocabulary-fragment-styles";

export class PortalShell {
  private mode: ShellMode;
  private mobileScreen: MobileScreen = "browse";
  private selectedName: string | undefined;
  private selectedComponent: ComponentId = "vocabulary";
  /** Desktop-only: collapses the Domains tree ("Explorer" pane) down to
   * a slim re-expand rail, giving the view pane the full width. Never
   * consulted in mobile mode -- the tree there is its own full-screen
   * "browse" step (mobileScreen), not a side pane, so there's nothing
   * analogous to minimize. */
  private treeCollapsed = false;
  private readonly title: string;
  private container: HTMLElement | undefined;
  private readonly serviceStatusView: ServiceStatusView;
  private readonly sentenceReaderView: SentenceReaderView;
  private renderToken = 0;
  // The Domain name whose Vocabulary fragment is currently mounted --
  // set once loadView() actually finishes mounting one (not at request
  // time: a stale or failed fetch should never become the search
  // bridge's target). searchWordsBridge() reads this to know which
  // Domain a "lira-search-words" event's search should run against,
  // since the fragment's own script only ever names a query, never a
  // Domain (it doesn't know its own Domain name -- DictionaryView never
  // embeds it as data, only as the page title/breadcrumb text).
  private currentVocabularyDomainName: string | undefined;

  constructor(
    private readonly registry: PortalDomainRegistry,
    private readonly vocabularyClient: VocabularyWorkerClient,
    linguisticsClient: LinguisticsWorkerClient,
    private readonly statusBoard: ServiceStatusBoard,
    options: PortalShellOptions = {},
  ) {
    this.title = options.title ?? "LIRA";
    this.mode = typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches ? "mobile" : "desktop";
    this.selectedName = this.registry.roots()[0]?.name;
    // "Load WordNet" now lives in the Vocabulary view pane itself
    // (renderVocabToolbar()), not attached to the Background Services
    // row -- WordNet is a Vocabulary Service action a user reaches for
    // while looking at the Vocabulary view, not a generic service
    // control. ServiceStatusView keeps showing the Vocabulary Service's
    // live status (still useful there), just with no button of its own.
    this.serviceStatusView = new ServiceStatusView(statusBoard);
    this.sentenceReaderView = new SentenceReaderView(linguisticsClient);
    // Targeted update, not a full render() -- a status tick fires on
    // every synset-batch progress update during a WordNet seed
    // (dozens of times a second, vocabulary_worker.ts's own
    // PROGRESS_REPORT_INTERVAL), and render() remounts the Vocabulary
    // fragment's own <script> from scratch (loadView()'s own docstring
    // on why); doing that on every tick would both be wasteful and pile
    // up duplicate document-level listeners from repeated fragment
    // mounts. updateVocabToolbar() only ever touches the toolbar's own
    // markup, inside this shell's own DOM, never the fragment.
    this.statusBoard.subscribe((statuses) => {
      const vocabularyStatus = statuses.find((status) => status.id === "vocabulary");
      if (vocabularyStatus) this.updateVocabToolbar(vocabularyStatus);
    });
    // seedWordNet grows the target Domain's own word/relationship
    // counts after this shell's initial registry snapshot was built
    // (main.ts's own "ready" handling) -- re-render picks up both the
    // tree row's now-larger counts (renderTreeRows reads wordCount
    // straight off the registry) and, if that Domain's Vocabulary view
    // happens to be the one currently mounted, a fresh fragment fetch
    // (render()'s own loadView() call), since the worker already
    // invalidated its cached fragment for it (vocabulary_worker.ts's
    // own handleSeedWordNet).
    this.vocabularyClient.onDomainUpdated((domain) => {
      this.registry.add(domain);
      this.render();
    });
    this.searchWordsBridge();
    this.searchPhrasesBridge();
    this.searchSensesBridge();
    this.searchRelationshipsBridge();
    this.resolveHierarchyBridge();
  }

  /** Listens on `document` (not `this.container` -- that element gets
   * torn down and rebuilt by every render()'s own `innerHTML` write, a
   * plain child listener wouldn't survive that) for the Vocabulary
   * fragment's own "lira-search-words" event (dictionary_view.ts's
   * renderWordsOverCapacity(), dispatched only once a Domain is over
   * MAX_INTERACTIVE_WORDS) and answers it by calling
   * VocabularyWorkerClient.searchWords() against whichever Domain is
   * currently mounted, then dispatching "lira-search-words-result" back
   * with the same requestId for that same script's own result listener
   * to pick up. Set up once, for this shell's whole lifetime -- unlike
   * loadView()'s own per-fetch token, there's nothing to invalidate
   * here: a search answered for a Domain that's since been navigated
   * away from is simply ignored by the (now unmounted, event-listener-
   * free) fragment script that would have received it. */
  private searchWordsBridge(): void {
    document.addEventListener("lira-search-words", (event) => {
      const detail = (event as CustomEvent<LiraSearchWordsEventDetail>).detail;
      if (!this.currentVocabularyDomainName) return;
      void this.vocabularyClient
        .searchWords(this.currentVocabularyDomainName, {
          wordId: detail.wordId,
          word: detail.word,
          gloss: detail.gloss,
          definition: detail.definition,
          pos: detail.pos,
          domainLabel: detail.domain,
          rootWordsOnly: detail.rootWordsOnly,
          limit: detail.limit,
        })
        .then((result) => {
          document.dispatchEvent(
            new CustomEvent("lira-search-words-result", {
              detail: { requestId: detail.requestId, words: result.words, totalMatches: result.totalMatches },
            }),
          );
        });
    });
  }

  /** searchWordsBridge()'s own exact counterpart for the fragment's own
   * "lira-search-phrases" event -- answers it with
   * VocabularyWorkerClient.searchPhrases() against whichever Domain is
   * currently mounted, then dispatches "lira-search-phrases-result"
   * back with the same requestId. */
  private searchPhrasesBridge(): void {
    document.addEventListener("lira-search-phrases", (event) => {
      const detail = (event as CustomEvent<LiraSearchPhrasesEventDetail>).detail;
      if (!this.currentVocabularyDomainName) return;
      void this.vocabularyClient
        .searchPhrases(this.currentVocabularyDomainName, {
          word: detail.word,
          gloss: detail.gloss,
          definition: detail.definition,
          pos: detail.pos,
          limit: detail.limit,
        })
        .then((result) => {
          document.dispatchEvent(
            new CustomEvent("lira-search-phrases-result", {
              detail: { requestId: detail.requestId, phrases: result.phrases, totalMatches: result.totalMatches },
            }),
          );
        });
    });
  }

  /** searchWordsBridge()'s own exact counterpart for the fragment's own
   * "lira-search-senses" event -- answers it with
   * VocabularyWorkerClient.searchSenses() against whichever Domain is
   * currently mounted, then dispatches "lira-search-senses-result" back
   * with the same requestId. */
  private searchSensesBridge(): void {
    document.addEventListener("lira-search-senses", (event) => {
      const detail = (event as CustomEvent<LiraSearchSensesEventDetail>).detail;
      if (!this.currentVocabularyDomainName) return;
      void this.vocabularyClient
        .searchSenses(this.currentVocabularyDomainName, {
          word: detail.word,
          gloss: detail.gloss,
          definition: detail.definition,
          pos: detail.pos,
          limit: detail.limit,
        })
        .then((result) => {
          document.dispatchEvent(
            new CustomEvent("lira-search-senses-result", {
              detail: { requestId: detail.requestId, senses: result.senses, totalMatches: result.totalMatches },
            }),
          );
        });
    });
  }

  /** Same bridge pattern as searchWordsBridge() (this file's own
   * docstring above), for the fragment's "lira-search-relationships"
   * event instead -- answers it with
   * VocabularyWorkerClient.searchRelationships() against whichever
   * Domain is currently mounted, then dispatches
   * "lira-search-relationships-result" back with the same requestId.
   * One listener serves both of the fragment's own dispatch sites (a
   * Relationships-tab search, keyed by `query`, and a selected Word's
   * detail-panel relationship list, keyed by `wordId`) -- the fragment's
   * own script already tells them apart by requestId when the result
   * comes back, this bridge just relays whatever it was asked for. */
  private searchRelationshipsBridge(): void {
    document.addEventListener("lira-search-relationships", (event) => {
      const detail = (event as CustomEvent<LiraSearchRelationshipsEventDetail>).detail;
      if (!this.currentVocabularyDomainName) return;
      void this.vocabularyClient
        .searchRelationships(this.currentVocabularyDomainName, {
          wordId: detail.wordId,
          query: detail.query,
          limit: detail.limit,
        })
        .then((result) => {
          document.dispatchEvent(
            new CustomEvent("lira-search-relationships-result", {
              detail: { requestId: detail.requestId, relationships: result.relationships, totalMatches: result.totalMatches },
            }),
          );
        });
    });
  }

  /** Same bridge pattern as searchWordsBridge()/searchRelationshipsBridge()
   * (this file's own docstring above), for the fragment's own
   * "lira-resolve-hierarchy" event -- answers it with
   * VocabularyWorkerClient.resolveHierarchy() against whichever Domain
   * is currently mounted, then dispatches "lira-resolve-hierarchy-result"
   * back with the same requestId. */
  private resolveHierarchyBridge(): void {
    document.addEventListener("lira-resolve-hierarchy", (event) => {
      const detail = (event as CustomEvent<LiraResolveHierarchyEventDetail>).detail;
      if (!this.currentVocabularyDomainName) return;
      void this.vocabularyClient
        .resolveHierarchy(this.currentVocabularyDomainName, {
          kind: detail.kind,
          wordId: detail.wordId,
          limit: detail.limit,
        })
        .then((result) => {
          document.dispatchEvent(
            new CustomEvent("lira-resolve-hierarchy-result", {
              detail: { requestId: detail.requestId, ...result },
            }),
          );
        });
    });
  }

  mount(container: HTMLElement): void {
    this.container = container;
    document.title = this.title;
    this.ensureStyles();
    container.addEventListener("click", (event) => this.handleClick(event));
    this.render();
  }

  private handleClick(event: MouseEvent): void {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target || (target as HTMLButtonElement).disabled) return;
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
    } else if (action === "component") {
      this.selectedComponent = target.dataset.component as ComponentId;
      this.render();
    } else if (action === "toggle-tree") {
      this.treeCollapsed = !this.treeCollapsed;
      this.render();
    } else if (action === "seed-wordnet") {
      this.vocabularyClient.seedWordNet(SEED_TARGET_DOMAIN);
    } else if (action === "seed-common-vocabulary") {
      this.vocabularyClient.seedCommonVocabulary(SEED_TARGET_DOMAIN);
    }
  }

  /** The Vocabulary view pane's own toolbar -- "Seed Vocabulary" (the
   * Common Vocabulary Cache's own seed files) and "Load WordNet" (the
   * Princeton WordNet dict/ text), plus a live status line/progress bar
   * shared between them, sourced from the same ServiceStatusBoard row
   * ServiceStatusView used to attach a button to (statusBoard.get(
   * "vocabulary")'s own live state), just rendered inline in the
   * Vocabulary tab instead of the Background Services panel. Only shown
   * while the Vocabulary component tab is selected --
   * SEED_TARGET_DOMAIN's own docstring on why neither action depends on
   * which Domain is selected. Both buttons disable together while
   * either action is running -- they post through the one shared
   * "vocabulary" ServiceStatus row, the same way a single Load WordNet
   * button already did before this one grew a sibling. */
  private renderVocabToolbar(): string {
    return `<div class="portal-vocab-toolbar">${this.vocabToolbarInner(this.statusBoard.get("vocabulary"))}</div>`;
  }

  private vocabToolbarInner(status: ServiceStatus | undefined): string {
    const running = status?.state === "running";
    const progress = status?.progress;
    return `
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-common-vocabulary" ${running ? "disabled" : ""}>Seed Vocabulary</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-wordnet" ${running ? "disabled" : ""}>Load WordNet</button>
      <span class="portal-vocab-toolbar-detail">${status?.detail ? escapeHtml(status.detail) : ""}</span>
      ${
        progress !== undefined
          ? `<div class="portal-vocab-toolbar-progress"><div class="portal-vocab-toolbar-progress-fill" style="width:${Math.round(progress * 100)}%"></div></div>`
          : ""
      }
    `;
  }

  /** Targeted counterpart to renderVocabToolbar() -- see this class's
   * own constructor comment on why a status tick updates just this
   * element instead of calling render(). A no-op whenever the toolbar
   * isn't currently in the DOM (a different component tab is selected,
   * or nothing's mounted yet) -- the next renderVocabToolbar() call
   * picks up the current status fresh regardless, same as
   * setViewStatus()'s own pattern. */
  private updateVocabToolbar(status: ServiceStatus): void {
    const toolbar = this.container?.querySelector<HTMLElement>(".portal-vocab-toolbar");
    if (!toolbar) return;
    toolbar.innerHTML = this.vocabToolbarInner(status);
  }

  private ensureStyles(): void {
    if (document.getElementById(STYLE_ELEMENT_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    style.textContent = SHELL_CSS;
    document.head.appendChild(style);
  }

  /** The fragment's own CSS is identical across every Domain (it styles
   * class names like `.stat-row`/`.word-form`, not domain-specific
   * selectors), so it's injected once, the first time any Domain's
   * Vocabulary view loads -- the same idempotent `ensureStyles`
   * pattern this shell already uses for its own chrome. */
  private ensureFragmentStyles(css: string): void {
    if (document.getElementById(FRAGMENT_STYLE_ELEMENT_ID)) return;
    const style = document.createElement("style");
    style.id = FRAGMENT_STYLE_ELEMENT_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  private render(): void {
    if (!this.container) return;
    const selected = this.selectedName ? this.registry.get(this.selectedName) : undefined;
    // Invalidate any Vocabulary fragment fetch still in flight from a
    // previous render pass -- e.g. the initial render (selectedComponent
    // defaults to "vocabulary") kicks off loadView() before the user
    // ever touches the switcher; if they click Linguistics before that
    // renderDomain() promise resolves, its own token guard (inside
    // loadView()) must see a stale token so it no-ops instead of
    // overwriting the now-linguistics `.portal-fragment-mount` with a
    // vocabulary fragment. Bumping here, unconditionally, on *every*
    // render (not just loadView's own calls) is what actually closes
    // that race -- loadView() still bumps it again for itself, which is
    // harmless (monotonic counter, always fine to bump twice).
    this.renderToken++;

    const treeCollapsedClass = this.mode === "desktop" && this.treeCollapsed ? "tree-collapsed" : "";
    this.container.innerHTML = `
      <div class="portal-shell mode-${this.mode} ${treeCollapsedClass}">
        ${this.renderTopbar(selected)}
        <div class="portal-body">
          ${this.renderBody(selected)}
        </div>
      </div>
    `;

    const statusMount = this.container.querySelector<HTMLElement>(".portal-service-status");
    if (statusMount) this.serviceStatusView.mount(statusMount);

    if (selected && this.selectedComponent === "vocabulary") {
      void this.loadView(selected);
    } else if (selected && this.selectedComponent === "linguistics") {
      this.loadLinguisticsView();
    }
  }

  /** Mounts the Linguistics `SentenceReaderView` into the pane's
   * fragment container. This call itself is synchronous (no per-Domain
   * fetch to race), and `SentenceReaderView` guards its own async
   * `read()` calls against staleness internally (its own
   * `requestToken`) -- but `render()`'s own `renderToken` bump above is
   * still what stops a *different*, already in-flight Vocabulary
   * fragment fetch from a previous render pass clobbering this mount
   * once it resolves; see render()'s own comment. */
  private loadLinguisticsView(): void {
    if (!this.container) return;
    const mount = this.container.querySelector<HTMLElement>(".portal-fragment-mount");
    if (mount) this.sentenceReaderView.mount(mount);
  }

  /** Requests the selected Domain's Vocabulary fragment from the worker
   * and, once it arrives, mounts it into the still-present fragment
   * container -- a targeted DOM update rather than a full re-render, so
   * a slower fetch doesn't get raced or clobbered by the user picking a
   * different Domain in the meantime (`token` guards exactly that).
   * renderDomain() can reject (RenderErrorMessage's own docstring,
   * vocabulary_worker_protocol.ts) -- surfaced here as a view status
   * message instead of leaving "Loading Vocabulary…" up forever. */
  private async loadView(domain: PortalDomain): Promise<void> {
    const token = ++this.renderToken;
    this.setViewStatus("Loading Vocabulary…");
    let fragment: RenderedFragment;
    try {
      fragment = await this.vocabularyClient.renderDomain(domain.name);
    } catch (error) {
      if (token !== this.renderToken) return;
      this.setViewStatus(`Couldn't load this Domain's Vocabulary view: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    if (token !== this.renderToken || !this.container) return;

    this.ensureFragmentStyles(fragment.style);
    const mount = this.container.querySelector<HTMLElement>(".portal-fragment-mount");
    if (mount) {
      mount.innerHTML = fragment.body;
      // Set only once the fragment is actually about to mount, not at
      // request time -- searchWordsBridge()'s own docstring on why a
      // stale/failed fetch must never become the search bridge's
      // target.
      this.currentVocabularyDomainName = domain.name;
      const script = document.createElement("script");
      script.textContent = `(function () {\n${fragment.script}\n})();`;
      mount.appendChild(script);
    }
    this.setViewStatus(undefined);
  }

  private setViewStatus(text: string | undefined): void {
    const status = this.container?.querySelector<HTMLElement>(".portal-view-status");
    if (!status) return;
    status.textContent = text ?? "";
    status.style.display = text ? "block" : "none";
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
    if (this.treeCollapsed) {
      return `
        <nav class="portal-tree portal-tree--collapsed">
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Expand Domains" aria-label="Expand Domains" aria-expanded="false">${ICON_CHEVRON_RIGHT}</button>
        </nav>`;
    }
    return `
      <nav class="portal-tree">
        <div class="portal-tree-label">
          <span>Domains</span>
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Collapse Domains" aria-label="Collapse Domains" aria-expanded="true">${ICON_CHEVRON_LEFT}</button>
        </div>
        ${this.renderTreeRows(0)}
      </nav>`;
  }

  private renderTreeRows(depth: number, parentName?: string): string {
    const domains = depth === 0 ? this.registry.roots() : this.registry.children(parentName ?? "");
    return domains
      .map((domain) => {
        const kids = this.registry.children(domain.name);
        const selected = domain.name === this.selectedName;
        return `
          <div class="portal-tree-row depth-${depth} ${selected ? "selected" : ""}" data-action="select" data-domain="${escapeHtml(domain.name)}">
            ${kids.length > 0 ? ICON_CHEVRON_DOWN : `<span class="chev-spacer"></span>`}
            ${ICON_FOLDER}
            <span class="name">${escapeHtml(domain.name)}</span>
            <span class="count">${domain.wordCount.toLocaleString()}</span>
          </div>
          ${kids.length > 0 ? this.renderTreeRows(depth + 1, domain.name) : ""}
        `;
      })
      .join("");
  }

  private renderComponentSwitcher(): string {
    return `
      <div class="portal-component-switcher" role="tablist" aria-label="UI Component">
        ${COMPONENTS.map((component) => `
          <button
            type="button"
            role="tab"
            data-action="component"
            data-component="${component.id}"
            class="${component.id === this.selectedComponent ? "active" : ""}"
            ${component.available ? "" : "disabled"}
            title="${component.available ? "" : "Not ported yet"}"
            aria-selected="${component.id === this.selectedComponent}"
          >${escapeHtml(component.label)}${component.available ? "" : ` <span class="not-ported-badge">Not ported</span>`}</button>
        `).join("")}
      </div>`;
  }

  private renderViewPane(selected: PortalDomain | undefined, fullWidth = false): string {
    const switcher = this.renderComponentSwitcher();
    const statusPanel = `<div class="portal-service-status"></div>`;
    // SEED_TARGET_DOMAIN's own docstring on why neither action depends
    // on which Domain is selected -- shown for the whole Vocabulary
    // tab, including its "Select a Domain to continue" state below, not
    // only once a fragment is actually mounted.
    const vocabToolbar = this.selectedComponent === "vocabulary" ? this.renderVocabToolbar() : "";

    if (!selected) {
      return `
        <div class="portal-view ${fullWidth ? "portal-view--full" : ""}">
          ${switcher}
          ${vocabToolbar}
          <div class="portal-view-empty">Select a Domain to continue.</div>
          ${statusPanel}
        </div>`;
    }

    const component = COMPONENTS.find((c) => c.id === this.selectedComponent);
    const content = component?.available
      ? `
        <div class="portal-view-status" style="display:none"></div>
        <div class="portal-fragment-mount"></div>`
      : `<div class="portal-view-empty">${escapeHtml(component?.label ?? "This component")} is not ported yet.</div>`;

    return `
      <div class="portal-view ${fullWidth ? "portal-view--full" : ""}">
        ${switcher}
        ${vocabToolbar}
        ${content}
        ${statusPanel}
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
const ICON_CHEVRON_LEFT = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>`;
const ICON_CHEVRON_RIGHT = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>`;

// Token names and values below match vocabulary/ui/dictionary_view.py's
// own `:root` block exactly (--ground/--surface/--ink/--ink-muted/
// --accent/--accent-ink/--line/--line-strong/--shadow/--radius/
// --font-display/--font-body/--font-mono) -- the DictionaryView
// fragment's own extracted CSS (ensureFragmentStyles above) assumes
// every one of these exists on an ancestor element, the same "shared
// chrome, defined once" contract render_fragment()'s own docstring
// describes. --surface-2/--ink-faint/--accent-soft are this shell's
// own additions (tree hover/selection, disabled-tab dimming) --
// DictionaryView's page never needed them standing alone.
const SHELL_CSS = `
.portal-shell {
  --ground: #F4F5F1; --surface: #FFFFFF; --surface-2: #ECEEE8; --ink: #1C2321; --ink-muted: #5B6660;
  --ink-faint: #8B948E; --accent: #2B6E63; --accent-ink: #FFFFFF; --accent-soft: #DCE9E4;
  --line: #DDE0DA; --line-strong: #C4C9BF;
  --shadow: 0 1px 2px rgba(28, 35, 33, 0.06), 0 4px 12px rgba(28, 35, 33, 0.04);
  --radius: 6px;
  --font-display: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: 'SF Mono', 'Cascadia Code', Consolas, 'Liberation Mono', Menlo, monospace;
  font-family: var(--font-body);
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
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25);
  }
}
.portal-topbar { display: flex; align-items: center; gap: 0.75rem; padding: 0.55rem 0.9rem; background: var(--surface-2); border-bottom: 1px solid var(--line); }
.portal-topbar-title { font-weight: 600; font-size: 0.92rem; flex: 1; }
.portal-back { background: none; border: none; color: var(--accent); cursor: pointer; padding: 0.2rem; display: flex; }
.portal-back svg { width: 16px; height: 16px; }
.portal-breadcrumb { display: flex; align-items: center; gap: 0.35rem; font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-muted); flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; }
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
.tree-collapsed .portal-body { grid-template-columns: 34px 1fr; }
.portal-tree { background: var(--surface-2); border-right: 1px solid var(--line); padding: 0.75rem 0.5rem; overflow-y: auto; }
.portal-tree--mobile { border-right: none; padding: 0.5rem; }
.portal-tree--collapsed { display: flex; justify-content: center; padding: 0.6rem 0; overflow: visible; }
.portal-tree-label { display: flex; align-items: center; justify-content: space-between; gap: 0.3rem; font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint); padding: 0.2rem 0.35rem 0.5rem 0.55rem; }
.portal-tree-toggle { background: none; border: none; color: var(--ink-faint); cursor: pointer; padding: 0.2rem; border-radius: 4px; display: flex; flex: none; }
.portal-tree-toggle svg { width: 12px; height: 12px; }
.portal-tree-toggle:hover { background: var(--accent-soft); color: var(--accent); }
.portal-tree-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.portal-tree--collapsed .portal-tree-toggle svg { width: 13px; height: 13px; }
.portal-tree-row { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.55rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer; }
.portal-tree-row:hover { background: var(--accent-soft); }
.portal-tree-row.selected { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.portal-tree-row.depth-1 { padding-left: 1.35rem; }
.portal-tree-row.depth-2 { padding-left: 2.3rem; }
.portal-tree-row .i-chev { width: 10px; height: 10px; color: var(--ink-faint); flex: none; }
.portal-tree-row .chev-spacer { width: 10px; flex: none; }
.portal-tree-row .i-folder { width: 15px; height: 15px; color: var(--accent); flex: none; }
.portal-tree-row .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.portal-tree-row .count { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-faint); }
.portal-view { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.portal-view-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--ink-muted); font-size: 0.88rem; padding: 2rem; text-align: center; }
.portal-component-switcher { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.6rem 0.9rem; border-bottom: 1px solid var(--line); flex: none; }
.portal-component-switcher button {
  border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink-muted);
  font-family: inherit; font-size: 0.8rem; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 999px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 0.4rem;
}
.portal-component-switcher button.active { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.portal-component-switcher button:disabled { cursor: not-allowed; opacity: 0.55; }
.portal-component-switcher button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.not-ported-badge { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; opacity: 0.75; }
.portal-vocab-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem; padding: 0.55rem 0.9rem; border-bottom: 1px solid var(--line); flex: none; }
.portal-vocab-toolbar-action {
  font-family: inherit; font-size: 0.76rem; font-weight: 600; letter-spacing: 0.01em;
  border: 1px solid var(--line-strong); background: var(--surface); color: var(--accent);
  padding: 0.3rem 0.75rem; border-radius: 999px; cursor: pointer; flex: none;
}
.portal-vocab-toolbar-action:hover:not(:disabled) { background: var(--accent-soft); }
.portal-vocab-toolbar-action:disabled { cursor: not-allowed; opacity: 0.55; }
.portal-vocab-toolbar-action:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.portal-vocab-toolbar-detail { font-size: 0.78rem; color: var(--ink-muted); flex: 1; min-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.portal-vocab-toolbar-progress { flex: 0 0 100%; height: 4px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.portal-vocab-toolbar-progress-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.2s ease-out; }
.portal-view-status { padding: 0.4rem 0.9rem 0; font-size: 0.76rem; color: var(--ink-muted); flex: none; }
.portal-fragment-mount { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; padding: 0.85rem 0.9rem 1.1rem; background: var(--ground); }
.mode-mobile .portal-fragment-mount { min-height: 55vh; }
/* Scoped override, not an edit of the ported fragment CSS itself
   (that stays a verbatim, mechanical extraction from
   vocabulary/ui/dictionary_view.py -- see ensureFragmentStyles above):
   DictionaryView's own .tabs group uses overflow: hidden to keep its
   pill shape, which was never a problem at the standalone page's full
   width but clips the last tab ("Cyclic") once the pane is narrower
   than the Portal makes it. Scrolling the group horizontally here, via
   a higher-specificity selector that only applies inside this mount,
   keeps every tab reachable without touching the ported string. */
.portal-fragment-mount .tabs { max-width: 100%; overflow-x: auto; }
.portal-service-status { flex: none; }
`;
