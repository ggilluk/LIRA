/** SentenceReaderView: a Portal-native UI component for the Linguistics
 * Layer -- type or paste any text, read it through the real ported
 * state machine (SequenceEngine/PhraseReader/ClauseReader/SentenceReader,
 * via role/linguistics_worker_client.ts's LinguisticsWorkerClient) and
 * see the predicted structure it settled on plus the full search trace
 * ("word prediction": every phrase type the engine tried at every token
 * position, whether its required start state matched, every completion
 * it considered, and which one won -- see
 * role/linguistics_worker_protocol.ts's own TracePosition docstring).
 *
 * This is NOT a port of ui/sentence_reader_view.py or
 * ui/sentence_reader_server.py -- those render a full standalone HTML
 * page (own masthead, own :root tokens, a fetch("/api/read") call
 * against a local Python HTTP server, with a precomputed offline
 * example set as fallback) meant to stand alone or be embedded via
 * render_fragment()'s marker-comment extraction. This component is
 * built directly against the Portal shell's own composition: it never
 * renders a title of its own (the Portal topbar's breadcrumb is the
 * only title, same rule vocabulary/ui/dictionary_view.ts's fragment
 * mode follows), it assumes the shell's own --ground/--surface/--ink/
 * --accent/etc. tokens are already on an ancestor element instead of
 * defining them itself, it reflows to whatever width the Portal gives
 * its pane (a CSS grid with auto-fit columns, not a min-width media
 * query keyed to the browser viewport), and "reading" a sentence calls
 * a real Web Worker directly (LinguisticsWorkerClient.read()) instead
 * of fetch()-ing a local HTTP server -- there is no server in this
 * port, the same "no server, just a worker" shape the Vocabulary
 * Service already uses. The visual language (part-of-speech chip
 * colours, validation badge colours, position/attempt/completion trace
 * blocks) is carried over from the old page, since it's what "look at
 * the old UI for inspiration" asked for -- but the markup, CSS class
 * names, and layout are new, scoped under `.lira-sr-*` so nothing here
 * can collide with DictionaryView's own fragment classes mounted
 * alongside it. */

import { PartOfSpeech } from "../../vocabulary/data/part_of_speech";
import type { LinguisticsWorkerClient } from "../role/linguistics_worker_client";
import type {
  JsonBlock,
  JsonDocument,
  JsonPhrase,
  JsonReadingError,
  JsonSentence,
  JsonSentenceSummary,
  PredictedWord,
  ReadDocumentResult,
  ReadResult,
  TraceAttempt,
  TracePosition,
  TraceToken,
} from "../role/linguistics_worker_protocol";

// Same hex values as vocabulary/ui/dictionary_view.ts's own POS_COLORS
// (which itself matches vocabulary/ui/dictionary_view.py and
// linguistics/ui/sentence_reader_server.py) -- duplicated, not
// cross-imported, so a part of speech reads the same colour wherever it
// appears across LIRA's UI surfaces, without this module depending on
// DictionaryView's.
const POS_COLORS: Record<string, string> = {
  [PartOfSpeech[PartOfSpeech.NOUN]]: "#3B6EA5",
  [PartOfSpeech[PartOfSpeech.PROPER_NOUN]]: "#274472",
  [PartOfSpeech[PartOfSpeech.VERB]]: "#B2542D",
  [PartOfSpeech[PartOfSpeech.ADJECTIVE]]: "#7A5CA6",
  [PartOfSpeech[PartOfSpeech.ADVERB]]: "#B08900",
  [PartOfSpeech[PartOfSpeech.PRONOUN]]: "#5B7B6F",
  [PartOfSpeech[PartOfSpeech.DETERMINER]]: "#6E7B8B",
  [PartOfSpeech[PartOfSpeech.PREPOSITION]]: "#7B6E5B",
  [PartOfSpeech[PartOfSpeech.CONJUNCTION]]: "#6B7280",
  [PartOfSpeech[PartOfSpeech.PARTICLE]]: "#8A7B6E",
  [PartOfSpeech[PartOfSpeech.AUXILIARY]]: "#5B6E8B",
  [PartOfSpeech[PartOfSpeech.INTERJECTION]]: "#C2544B",
  [PartOfSpeech[PartOfSpeech.NUMERAL]]: "#4B8A7B",
  [PartOfSpeech[PartOfSpeech.SYMBOL]]: "#8A8A8A",
  [PartOfSpeech[PartOfSpeech.PUNCTUATION]]: "#9A9A9A",
  [PartOfSpeech[PartOfSpeech.OTHER]]: "#7A7A7A",
};

const VALIDATION_COLORS: Record<string, string> = { VALID: "#2B6E63", UNRESOLVED: "#B08900", INVALID: "#B2542D" };

// Same worked examples sentence_reader_server.py's own DEFAULT_QUICK_EXAMPLES
// ships -- chosen there to exercise a spread of outcomes (VALID,
// INVALID for a missing predicate, and vocabulary this Common Vocabulary
// Cache slice actually seeds), so they're just as useful a starting
// point here.
const QUICK_EXAMPLES = [
  "A meaning is a representation.",
  "The word over the meaning.",
  "The use is a state.",
  "The word wants to use the meaning.",
  "The meaning and the word perceive the state.",
];

const STYLE_ELEMENT_ID = "lira-sentence-reader-styles";

export class SentenceReaderView {
  private container: HTMLElement | undefined;
  private reading = false;
  private requestToken = 0;

  /** The last `read-document` result's own tree, kept so tree-node
   * clicks (toggle a Paragraph, select a Sentence) can re-render just
   * the tree/detail panels instead of re-reading the whole Document.
   * `expandedNodes`/`selectedKey` use the same node-key scheme
   * `renderTree()` builds ("doc", "b{blockIndex}", "b{blockIndex}s{
   * sentenceIndex}") -- see parseSentenceKey()'s own docstring.
   * `detailCache` holds one selected Sentence's full predicted
   * structure + trace per node key, fetched on demand via `client.read`
   * (see `selectSentenceNode()`) rather than up front for every
   * Sentence a Document might contain. */
  private documentResult: JsonDocument | undefined;
  private expandedNodes = new Set<string>();
  private selectedKey: string | undefined;
  private readonly detailCache = new Map<string, ReadResult>();
  private detailToken = 0;

  constructor(private readonly client: LinguisticsWorkerClient) {}

  mount(container: HTMLElement): void {
    this.container = container;
    this.ensureStyles();
    container.innerHTML = this.renderShell();
    this.wire();
    const textarea = container.querySelector<HTMLTextAreaElement>(".lira-sr-textarea");
    if (textarea?.value) void this.read(textarea.value);
  }

  destroy(): void {
    this.container = undefined;
  }

  private wire(): void {
    const root = this.container;
    if (!root) return;
    const textarea = root.querySelector<HTMLTextAreaElement>(".lira-sr-textarea");
    const button = root.querySelector<HTMLButtonElement>(".lira-sr-read-btn");
    if (textarea && button) {
      button.addEventListener("click", () => void this.read(textarea.value));
      textarea.addEventListener("keydown", (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void this.read(textarea.value);
      });
    }
    root.querySelectorAll<HTMLButtonElement>(".lira-sr-example").forEach((chip) => {
      chip.addEventListener("click", () => {
        const example = chip.dataset.example ?? "";
        if (textarea) textarea.value = example;
        void this.read(example);
      });
    });
    const tree = root.querySelector<HTMLElement>(".lira-sr-tree");
    tree?.addEventListener("click", (event) => this.handleTreeClick(event));
    tree?.addEventListener("keydown", (event) => this.handleTreeKeydown(event));
  }

  /** Delegated click handler for the whole tree (mirrors
   * knowledge/ui/service_status_view.ts's own single delegated listener
   * on its collapsible panel): a click on a `[data-action="toggle-node"]`
   * chevron folds/unfolds that node's children in place, a click
   * anywhere else on a Sentence leaf row selects it -- Document and
   * Paragraph rows have no predicted structure/trace of their own to
   * show, so only a Sentence row is clickable outside its toggle. */
  private handleTreeClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const toggle = target.closest<HTMLElement>('[data-action="toggle-node"]');
    if (toggle) {
      this.toggleNode(toggle.dataset.node ?? "");
      return;
    }
    const row = target.closest<HTMLElement>('.lira-tree-row[data-kind="sentence"]');
    if (row) void this.selectSentenceNode(row.dataset.node ?? "");
  }

  private handleTreeKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = (event.target as HTMLElement).closest<HTMLElement>('.lira-tree-row[data-kind="sentence"]');
    if (!row) return;
    event.preventDefault();
    void this.selectSentenceNode(row.dataset.node ?? "");
  }

  private toggleNode(key: string): void {
    if (!key || !this.documentResult) return;
    if (this.expandedNodes.has(key)) this.expandedNodes.delete(key);
    else this.expandedNodes.add(key);
    this.renderTreeInPlace();
  }

  private renderTreeInPlace(): void {
    if (!this.documentResult) return;
    const tree = this.container?.querySelector<HTMLElement>(".lira-sr-tree");
    if (tree) tree.innerHTML = this.renderTree(this.documentResult);
  }

  /** Selects one Sentence node: marks it selected, makes sure its
   * Paragraph is expanded so the selection stays visible, then shows its
   * predicted structure/winner/trace -- from `detailCache` if this node
   * was already selected once this Document, otherwise via a fresh
   * `client.read()` call for just that Sentence's own text
   * (`skipLearning: true`, see linguistics_worker_protocol.ts's own
   * ReadRequest docstring for why re-selecting a node must not
   * double-reinforce it). */
  private async selectSentenceNode(key: string): Promise<void> {
    const doc = this.documentResult;
    const parsed = parseSentenceKey(key);
    if (!doc || !parsed) return;
    const block = doc.blocks[parsed.blockIndex];
    if (!block || block.blockKind !== "paragraph") return;
    const summary = block.sentences[parsed.sentenceIndex];
    if (!summary) return;

    this.selectedKey = key;
    this.expandedNodes.add(`b${parsed.blockIndex}`);
    this.renderTreeInPlace();

    const cached = this.detailCache.get(key);
    if (cached) {
      this.renderDetail(cached);
      return;
    }
    this.setPanelPlaceholder(".lira-sr-predicted", "Loading…");
    this.setPanelPlaceholder(".lira-sr-winner-panel", "Loading…");
    this.setPanelPlaceholder(".lira-sr-trace", "Loading…");
    const token = ++this.detailToken;
    const learningEnabled = this.isLearningEnabled();
    try {
      const result = await this.client.read(summary.text, learningEnabled, true);
      if (token !== this.detailToken || !this.container) return;
      this.detailCache.set(key, result);
      this.renderDetail(result);
    } catch (error) {
      if (token !== this.detailToken || !this.container) return;
      this.setError(error instanceof Error ? error.message : String(error));
    }
  }

  private isLearningEnabled(): boolean {
    const checkbox = this.container?.querySelector<HTMLInputElement>(".lira-sr-learning-toggle");
    return checkbox?.checked ?? true;
  }

  /** Reads `text` as a whole Document (DocumentReader classifies it into
   * Heading/Paragraph blocks and splits each Paragraph into Sentences)
   * rather than as a single Sentence -- a one-sentence input still comes
   * back as a one-Paragraph, one-Sentence Document, so the tree/detail
   * split below applies uniformly instead of needing a separate
   * single-sentence code path. */
  private async read(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || this.reading) return;
    const token = ++this.requestToken;
    const learningEnabled = this.isLearningEnabled();
    this.reading = true;
    this.setBusy(true);
    this.setError(undefined);
    try {
      const result = await this.client.readDocument(trimmed, learningEnabled);
      if (token !== this.requestToken || !this.container) return;
      this.renderDocument(result);
    } catch (error) {
      if (token !== this.requestToken || !this.container) return;
      this.setError(error instanceof Error ? error.message : String(error));
    } finally {
      if (token === this.requestToken) {
        this.reading = false;
        this.setBusy(false);
      }
    }
  }

  private setBusy(busy: boolean): void {
    const button = this.container?.querySelector<HTMLButtonElement>(".lira-sr-read-btn");
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? "Reading…" : "Read";
  }

  /** Reflects the worker's own reported learning state back next to the
   * checkbox -- genuine accumulated evidence (`LexicalEvidenceStore.
   * totalObservations`), not a client-side guess, so the checkbox's
   * effect is visibly real rather than merely claimed. */
  private setLearningStatus(status: ReadResult["learning"] | undefined): void {
    const el = this.container?.querySelector<HTMLElement>(".lira-sr-learning-status");
    if (!el) return;
    if (!status || !status.enabled) {
      el.textContent = "Learning off";
      return;
    }
    const gain = status.recordedThisRead > 0 ? ` (+${status.recordedThisRead})` : "";
    el.textContent = `Learning: ${status.totalObservations} observation${status.totalObservations === 1 ? "" : "s"}${gain}`;
  }

  private setError(message: string | undefined): void {
    const banner = this.container?.querySelector<HTMLElement>(".lira-sr-error");
    if (!banner) return;
    banner.textContent = message ?? "";
    banner.style.display = message ? "block" : "none";
  }

  /** Handles a fresh `read-document` result: replaces the tree entirely
   * (a new Document supersedes whatever was selected/expanded before),
   * then auto-selects a Sentence -- the first one carrying an error
   * across every Paragraph, or failing that just the first Sentence --
   * the same "reveal the interesting thing first" default a code
   * editor's outline gives an unfolded error/warning. An empty Document
   * (no Sentences at all) leaves the detail panels showing an explicit
   * placeholder instead of silently staying on stale content. */
  private renderDocument(result: ReadDocumentResult): void {
    this.documentResult = result.document;
    this.detailCache.clear();
    this.expandedNodes = new Set(["doc"]);
    this.selectedKey = undefined;
    this.setLearningStatus(result.learning);

    const autoKey = pickAutoSelection(result.document);
    if (autoKey) {
      void this.selectSentenceNode(autoKey);
      return;
    }
    this.renderTreeInPlace();
    this.setPanelPlaceholder(".lira-sr-predicted", "No sentences found in this text.");
    this.setPanelPlaceholder(".lira-sr-winner-panel", "No sentences found in this text.");
    this.setPanelPlaceholder(".lira-sr-trace", "No sentences found in this text.");
  }

  private renderDetail(result: ReadResult): void {
    const predicted = this.container?.querySelector<HTMLElement>(".lira-sr-predicted");
    const winner = this.container?.querySelector<HTMLElement>(".lira-sr-winner-panel");
    const trace = this.container?.querySelector<HTMLElement>(".lira-sr-trace");
    if (predicted) predicted.innerHTML = this.renderPredicted(result.predicted, result.words);
    if (winner) winner.innerHTML = this.renderWinner(result.predicted, result.trace);
    if (trace) trace.innerHTML = this.renderTrace(result.trace);
  }

  private setPanelPlaceholder(selector: string, message: string): void {
    const el = this.container?.querySelector<HTMLElement>(selector);
    if (el) el.innerHTML = `<div class="lira-sr-placeholder">${escapeHtml(message)}</div>`;
  }

  private ensureStyles(): void {
    if (document.getElementById(STYLE_ELEMENT_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  private renderShell(): string {
    return `
      <div class="lira-sr">
        <div class="lira-sr-input-card">
          <textarea class="lira-sr-textarea" placeholder="e.g. A meaning is a representation.">${escapeHtml(QUICK_EXAMPLES[0])}</textarea>
          <div class="lira-sr-input-row">
            <button type="button" class="lira-sr-read-btn">Read</button>
            <label class="lira-sr-learning-toggle-label" title="When on, a sentence that reads VALID reinforces the state machine's own learned lexical evidence -- future ambiguous reads prefer word/phrase transitions it has seen validated before.">
              <input type="checkbox" class="lira-sr-learning-toggle" checked>
              Learning
            </label>
            <span class="lira-sr-hint">or press &#8984;/Ctrl + Enter</span>
            <span class="lira-sr-learning-status"></span>
          </div>
          <div class="lira-sr-examples">
            ${QUICK_EXAMPLES.map((example) => `<button type="button" class="lira-sr-example" data-example="${escapeHtml(example)}">${escapeHtml(example)}</button>`).join("")}
          </div>
        </div>
        <div class="lira-sr-error" style="display:none"></div>
        <div class="lira-sr-workspace">
          <section class="lira-sr-tree-panel">
            <h3>Document structure</h3>
            <p class="lira-sr-panel-sub">Document &rarr; Paragraph &rarr; Sentence. Select a sentence to see it on the right.</p>
            <div class="lira-sr-tree"><div class="lira-sr-placeholder">Read some text to see its structure.</div></div>
          </section>
          <div class="lira-sr-panels">
            <section class="lira-sr-panel">
              <h3>Predicted structure</h3>
              <p class="lira-sr-panel-sub">The one interpretation the state machine ranked highest and materialised for the selected sentence.</p>
              <div class="lira-sr-predicted"><div class="lira-sr-placeholder">Read a sentence to see its predicted structure.</div></div>
            </section>
            <section class="lira-sr-panel">
              <h3>Winner</h3>
              <p class="lira-sr-panel-sub">The winning sentence type and the winning phrase for each clause role.</p>
              <div class="lira-sr-winner-panel"><div class="lira-sr-placeholder">Read a sentence to see its winning interpretation.</div></div>
              <h3 class="lira-sr-trace-heading">Full trace — word prediction</h3>
              <p class="lira-sr-panel-sub">Every phrase type the state machine tried at every token position — matched, completed, rejected, and why.</p>
              <div class="lira-sr-trace"><div class="lira-sr-placeholder">Read a sentence to see the full search trace.</div></div>
            </section>
          </div>
        </div>
      </div>
    `;
  }

  /** Document/Heading/Paragraph/Sentence outline -- the same recursive
   * `<li>`/`<ul>` nesting vocabulary/ui/dictionary_view.ts's own
   * `hierarchy-tree` uses for its word-relationship tree, and the same
   * chevron/`aria-expanded` fold toggle knowledge/ui/service_status_view.ts's
   * own collapsible panel uses, combined here into one component: every
   * Paragraph/Document node can fold its children away, and a folded
   * Paragraph shows a one-line summary ("3 sentences, 1 error") in place
   * of the hidden rows, the same "collapsing never hides an error
   * silently" rule ServiceStatusView's own docstring states -- so triage
   * is possible without expanding anything. Only Sentence rows are ever
   * selectable (`data-kind="sentence"`): a Heading has no validation of
   * its own (heading.ts's own docstring) and a Document/Paragraph has no
   * single predicted structure/trace to show in the panels beside it. */
  private renderTree(doc: JsonDocument): string {
    const docExpanded = this.expandedNodes.has("doc");
    const docColor = VALIDATION_COLORS[doc.validation] ?? "#7A7A7A";
    const paragraphCount = doc.blocks.filter((block) => block.blockKind === "paragraph").length;
    const headingCount = doc.blocks.length - paragraphCount;
    const paragraphErrors = doc.blocks.reduce((sum, block) => sum + (block.blockKind === "paragraph" ? block.errors.length : 0), 0);
    const docSummary = [
      `${paragraphCount} paragraph${paragraphCount === 1 ? "" : "s"}`,
      headingCount ? `${headingCount} heading${headingCount === 1 ? "" : "s"}` : "",
      paragraphErrors ? `${paragraphErrors} error${paragraphErrors === 1 ? "" : "s"}` : "",
    ].filter(Boolean).join(", ");
    return `
      <ul class="lira-tree-root">
        <li class="lira-tree-node">
          <div class="lira-tree-row" data-node="doc" data-kind="document">
            ${treeToggle("doc", docExpanded)}
            <span class="lira-tree-dot" style="background:${docColor}"></span>
            <span class="lira-tree-label">Document</span>
            ${docExpanded ? "" : `<span class="lira-tree-summary">${escapeHtml(docSummary)}</span>`}
          </div>
          ${docExpanded ? `<ul>${doc.blocks.map((block, index) => this.renderBlockNode(block, index)).join("")}</ul>` : ""}
        </li>
      </ul>`;
  }

  private renderBlockNode(block: JsonBlock, index: number): string {
    const key = `b${index}`;
    if (block.blockKind === "heading") {
      return `
        <li class="lira-tree-node lira-tree-leaf">
          <div class="lira-tree-row" data-node="${key}" data-kind="heading">
            <span class="lira-tree-spacer"></span>
            <span class="lira-tree-heading-pill">H${block.level}</span>
            <span class="lira-tree-label">${escapeHtml(truncate(block.text, 48))}</span>
          </div>
        </li>`;
    }
    const expanded = this.expandedNodes.has(key);
    const color = VALIDATION_COLORS[block.validation] ?? "#7A7A7A";
    const summary = [
      `${block.sentences.length} sentence${block.sentences.length === 1 ? "" : "s"}`,
      block.errors.length ? `${block.errors.length} error${block.errors.length === 1 ? "" : "s"}` : "",
    ].filter(Boolean).join(", ");
    return `
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${key}" data-kind="paragraph">
          ${treeToggle(key, expanded)}
          <span class="lira-tree-dot" style="background:${color}"></span>
          <span class="lira-tree-label">Paragraph ${index + 1}</span>
          ${expanded ? "" : `<span class="lira-tree-summary">${escapeHtml(summary)}</span>`}
        </div>
        ${expanded ? `<ul>${block.sentences.map((sentence, sentenceIndex) => this.renderSentenceNode(sentence, key, sentenceIndex)).join("")}</ul>` : ""}
      </li>`;
  }

  private renderSentenceNode(sentence: JsonSentenceSummary, blockKey: string, index: number): string {
    const key = `${blockKey}s${index}`;
    const color = VALIDATION_COLORS[sentence.validation] ?? "#7A7A7A";
    return `
      <li class="lira-tree-node lira-tree-leaf">
        <div class="lira-tree-row ${this.selectedKey === key ? "selected" : ""}" data-node="${key}" data-kind="sentence" role="button" tabindex="0">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${color}"></span>
          <span class="lira-tree-label">Sentence ${index + 1}</span>
          <span class="lira-tree-snippet">${escapeHtml(truncate(sentence.text, 40))}</span>
          ${sentence.errors.length ? `<span class="lira-tree-error-count">${sentence.errors.length}</span>` : ""}
        </div>
      </li>`;
  }

  /** Compact digest of "what won": the sentence type/validation/confidence
   * the state machine settled on, the winning phrase for each clause
   * role (subject/predicate/object/complement/modifiers -- exactly the
   * fields Clause already commits to one phrase for; there is no
   * competing alternative phrase per role stored anywhere else to show),
   * and the per-token-position winning phrase type the full trace below
   * repeats in much more detail -- this is the "read the outcome in one
   * glance" summary, the trace panel underneath is "see why". */
  private renderWinner(sentence: JsonSentence, trace: readonly TracePosition[]): string {
    const clause = sentence.clauses[0];
    const roles: [string, JsonPhrase | null][] = clause
      ? [
          ["subject", clause.subject],
          ["predicate", clause.predicate],
          ["object", clause.object],
          ["complement", clause.complement],
          ...clause.modifiers.map((modifier): [string, JsonPhrase | null] => ["modifier", modifier]),
        ]
      : [];
    const roleRows = roles.map(([role, phrase]) => roleRow(role, phrase)).join("");
    const positions = trace.length
      ? `<div class="lira-sr-winner-positions">
          ${trace.map((position) => `
            <span class="lira-sr-winner-chip">
              <span class="lira-sr-mono lira-sr-faint">#${position.startIndex}</span>
              <span class="lira-sr-strong lira-sr-mono">${escapeHtml(position.tokenText ?? "")}</span>
              <span class="lira-sr-faint">${escapeHtml(position.winnerPhraseType ?? "none")}</span>
            </span>`).join("")}
        </div>`
      : "";
    return `
      <div class="lira-sr-winner-head">
        ${badge(sentence.validation)}
        <span class="lira-sr-strong">${escapeHtml(sentence.sentenceType ?? "UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${sentence.confidence.toFixed(2)}</span>
      </div>
      ${roleRows ? `<div class="lira-sr-winner-roles">${roleRows}</div>` : ""}
      ${positions}
    `;
  }

  /** The predicted sentence as a simple, in-order array of words --
   * flows as running text (like Sentence.text itself), not a nested
   * clause/phrase tree. Each word is its own focusable/clickable span,
   * the same `.def-word`/`.def-tooltip` hover-or-focus pattern
   * vocabulary/ui/dictionary_view.ts's own inline word-in-a-definition
   * rendering uses (a `tabindex="0"` span reveals an absolutely
   * positioned tooltip on `:hover`/`:focus`, which a click satisfies for
   * free since clicking a focusable element focuses it -- no separate
   * click handler needed) -- see renderPredictedWord()'s own tooltip
   * content for what it shows. An unresolved word (PredictedWord.resolved
   * === false: no seeded/hydrated Vocabulary sense, or a known word the
   * grammar didn't incorporate into any successfully-read phrase --
   * worker/linguistics_worker.ts's own buildPredictedWords()) is
   * highlighted with a yellow background directly in the sentence, not
   * hidden or reported only as a separate error line. */
  private renderPredicted(sentence: JsonSentence, words: readonly PredictedWord[]): string {
    const top = `
      <div class="lira-sr-clause-head">
        ${badge(sentence.validation)}
        <span class="lira-sr-strong">${escapeHtml(sentence.sentenceType ?? "UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${sentence.confidence.toFixed(2)}</span>
        <span class="lira-sr-faint">${sentence.punctuation ? `terminal "${escapeHtml(sentence.punctuation)}"` : "no terminal punctuation"}</span>
      </div>`;
    return `${top}${renderWordSentence(words)}${errorsList(sentence.errors)}`;
  }

  private renderTrace(trace: readonly TracePosition[]): string {
    if (!trace.length) return `<div class="lira-sr-empty">No trace positions recorded.</div>`;
    return trace.map((position) => this.renderPosition(position)).join("");
  }

  private renderPosition(position: TracePosition): string {
    const posTags = position.candidatePartsOfSpeech.length
      ? position.candidatePartsOfSpeech.join(", ")
      : position.isKnown === false ? "unseeded" : "";
    const winnerPos = position.winnerPartsOfSpeech.length
      ? `<div class="lira-sr-winner-pos">
          <span class="lira-sr-faint">Predicted part(s) of speech:</span>
          ${position.winnerPartsOfSpeech.map((word) => posChip(word.text, word.partOfSpeech)).join("")}
        </div>`
      : "";
    return `
      <div class="lira-sr-position">
        <div class="lira-sr-position-head">
          <span class="lira-sr-mono lira-sr-faint">#${position.startIndex}</span>
          <span class="lira-sr-strong lira-sr-mono">${escapeHtml(position.tokenText ?? "")}</span>
          <span class="lira-sr-faint">${escapeHtml(posTags)}</span>
          <span class="lira-sr-winner">&#8594; won by ${escapeHtml(position.winnerPhraseType ?? "none")}</span>
        </div>
        ${winnerPos}
        ${position.attempts.map((attempt) => this.renderAttempt(attempt)).join("")}
      </div>`;
  }

  private renderAttempt(attempt: TraceAttempt): string {
    const completions = attempt.completions.length
      ? attempt.completions.map((completion) => `
          <div class="lira-sr-completion ${completion.isWinner ? "winner" : ""}">
            ${completion.isWinner ? `<span class="lira-sr-win-mark">&#10003; winner</span>` : ""}
            "${escapeHtml(completion.text)}" — ${escapeHtml(completion.validation)}, confidence ${completion.confidence.toFixed(2)}
            ${renderTraceTokens(completion.tokens)}
          </div>`).join("")
      : attempt.rejectionReason
        ? `<div class="lira-sr-rejection">${escapeHtml(attempt.rejectionReason)}</div>`
        : "";
    return `
      <div class="lira-sr-attempt ${attempt.startMatch ? "" : "rejected"}">
        <div class="lira-sr-attempt-head">
          <span class="lira-sr-attempt-type">${escapeHtml(attempt.phraseType)}</span>
          <span class="lira-sr-match-mark ${attempt.startMatch ? "yes" : "no"}">${attempt.startMatch ? "start matched" : "no start match"}</span>
          <span class="lira-sr-faint lira-sr-mono">requires: ${attempt.requiredStart.map(escapeHtml).join(", ")}</span>
        </div>
        ${completions}
      </div>`;
  }
}

function roleRow(role: string, phrase: JsonPhrase | null): string {
  if (!phrase) return "";
  return `
    <div class="lira-sr-winner-role-row">
      <span class="lira-sr-winner-role-label">${escapeHtml(role)}</span>
      <span class="lira-sr-mono">"${escapeHtml(phrase.text)}"</span>
      <span class="lira-sr-faint">${escapeHtml(phrase.phraseType ?? "?")}</span>
    </div>`;
}

function treeToggle(key: string, expanded: boolean): string {
  return `<button type="button" class="lira-tree-toggle" data-action="toggle-node" data-node="${key}" aria-expanded="${expanded}">${ICON_CHEVRON}</button>`;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/** Parses a Sentence node key back into the `blocks`/`sentences` array
 * indices it names -- the inverse of the "b{blockIndex}s{sentenceIndex}"
 * key `renderSentenceNode()` builds. `undefined` for any other node key
 * (e.g. "doc" or a Heading/Paragraph's own "b{blockIndex}"), which the
 * caller (`selectSentenceNode()`) treats as "not a selectable node". */
function parseSentenceKey(key: string): { blockIndex: number; sentenceIndex: number } | undefined {
  const match = /^b(\d+)s(\d+)$/.exec(key);
  if (!match) return undefined;
  return { blockIndex: Number(match[1]), sentenceIndex: Number(match[2]) };
}

/** The Sentence node to select right after a fresh Document read: the
 * first one carrying an error, anywhere in the Document, or -- if
 * nothing is UNRESOLVED/INVALID -- simply the first Sentence overall.
 * `undefined` only when the Document has no Sentences at all (every
 * block is a Heading, or the input was empty). */
function pickAutoSelection(doc: JsonDocument): string | undefined {
  for (let blockIndex = 0; blockIndex < doc.blocks.length; blockIndex += 1) {
    const block = doc.blocks[blockIndex];
    if (block.blockKind !== "paragraph") continue;
    const erroredIndex = block.sentences.findIndex((sentence) => sentence.errors.length > 0);
    if (erroredIndex >= 0) return `b${blockIndex}s${erroredIndex}`;
  }
  for (let blockIndex = 0; blockIndex < doc.blocks.length; blockIndex += 1) {
    const block = doc.blocks[blockIndex];
    if (block.blockKind === "paragraph" && block.sentences.length > 0) return `b${blockIndex}s0`;
  }
  return undefined;
}

/** Joins the predicted word array into running text -- a space before
 * every word except an attached punctuation mark (".", ",", "!", "?",
 * ";", ":"), so the result reads like a real sentence rather than a
 * comma-separated array. */
function renderWordSentence(words: readonly PredictedWord[]): string {
  if (!words.length) return `<div class="lira-sr-empty">No words to show.</div>`;
  let html = "";
  words.forEach((word, index) => {
    const isAttachedPunctuation = /^[.,!?;:]+$/.test(word.text);
    if (index > 0 && !isAttachedPunctuation) html += " ";
    html += renderPredictedWord(word, index);
  });
  return `<div class="lira-sr-sentence">${html}</div>`;
}

function renderPredictedWord(word: PredictedWord, index: number): string {
  const unfoundClass = word.resolved ? "" : " lira-sr-word-unfound";
  return `<span class="lira-sr-word${unfoundClass}" tabindex="0" data-word-index="${index}">${escapeHtml(word.text)}${renderWordTooltip(word)}</span>`;
}

/** The `.def-tooltip`-shaped popup: word text as the title line, then
 * two meta lines -- validation + the predicted phrase this word was
 * read as part of (e.g. NOUN_PHRASE), then its predicted part of
 * speech + confidence -- or, for an unresolved word, the same honest
 * "not found" wording dictionary_view.ts's own unresolved `.def-word`
 * tooltip uses, since there is no committed reading to report a
 * phrase/POS/confidence for. */
function renderWordTooltip(word: PredictedWord): string {
  if (!word.resolved) {
    return `<span class="lira-sr-word-tooltip"><span class="tt-title">${escapeHtml(word.text)}</span><span class="tt-meta">Not found in the Common Vocabulary Cache</span></span>`;
  }
  const structureLine = [word.validation ?? "UNRESOLVED", word.phraseType ?? "no phrase"];
  const wordLine = [word.partOfSpeech ?? "?", `conf ${word.confidence !== null ? word.confidence.toFixed(2) : "—"}`];
  return `<span class="lira-sr-word-tooltip"><span class="tt-title">${escapeHtml(word.text)}</span>`
    + `<span class="tt-meta">${structureLine.map(escapeHtml).join(" · ")}</span>`
    + `<span class="tt-meta">${wordLine.map(escapeHtml).join(" · ")}</span></span>`;
}

function badge(validation: string): string {
  const color = VALIDATION_COLORS[validation] ?? "#7A7A7A";
  return `<span class="lira-sr-badge" style="background:${color}">${escapeHtml(validation)}</span>`;
}

function posChip(text: string, pos: string): string {
  const color = POS_COLORS[pos] ?? "#7A7A7A";
  return `
    <span class="lira-sr-pos-chip" style="background:${color}">
      <span class="w">${escapeHtml(text)}</span>
      <span class="p">${escapeHtml(pos)}</span>
    </span>`;
}

/** Renders one candidate completion's per-token part-of-speech
 * breakdown -- the sequence this specific reading committed to, not
 * just the token's candidate set. A marker token (e.g. INFINITIVE_PHRASE's
 * "to") or an unseeded token the grammar absorbed both carry
 * `partOfSpeech: null` (role/phrase_reader.ts's own TraceToken
 * docstring); labelled MARKER/UNKNOWN here instead of a blank chip. */
function renderTraceTokens(tokens: readonly TraceToken[]): string {
  if (!tokens.length) return "";
  const chips = tokens
    .map((token) => posChip(token.text, token.partOfSpeech ?? (token.isMarker ? "MARKER" : "UNKNOWN")))
    .join("");
  return `<div class="lira-sr-trace-tokens">${chips}</div>`;
}

function errorsList(errors: readonly JsonReadingError[]): string {
  if (!errors.length) return "";
  return `
    <div class="lira-sr-errors">
      ${errors.map((error) => `
        <div class="lira-sr-error-row">
          <span class="lira-sr-strong">${escapeHtml(error.kind)}:</span>
          ${escapeHtml(error.message)}${error.tokenText ? ` ("${escapeHtml(error.tokenText)}")` : ""}
        </div>`).join("")}
    </div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Same chevron knowledge/ui/service_status_view.ts's own collapsible
// panel uses, so a fold toggle looks identical everywhere in the Portal.
const ICON_CHEVRON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>`;

// Assumes the Portal shell's own --ground/--surface/--surface-2/--ink/
// --ink-muted/--ink-faint/--accent/--accent-ink/--line/--line-strong/
// --shadow/--radius/--font-display/--font-body/--font-mono tokens exist
// on an ancestor element (knowledge/ui/portal_shell.ts's own SHELL_CSS)
// -- the same "shared chrome, defined once" contract DictionaryView's
// fragment CSS assumes, but this stylesheet was authored against that
// contract from the outset rather than extracted from a standalone
// page, so there's no separate --surface-2/--ink-faint fallback pass to
// reconcile. `.lira-sr-workspace` puts the tree as a narrow flex sidebar
// beside `.lira-sr-panels`'s own existing `auto-fit`/`minmax` grid, and
// wraps (tree above content) at the Portal pane's own narrow width,
// same "no viewport media query" rule the rest of this stylesheet
// already follows.
const CSS = `
.lira-sr { display: flex; flex-direction: column; gap: 1rem; }
.lira-sr-input-card {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 0.9rem 1rem;
}
.lira-sr-textarea {
  width: 100%; min-height: 3.2rem; resize: vertical; font-family: var(--font-body); font-size: 0.95rem;
  color: var(--ink); background: var(--ground); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 0.6rem 0.7rem; line-height: 1.4; box-sizing: border-box;
}
.lira-sr-textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.lira-sr-input-row { display: flex; align-items: center; gap: 0.7rem; margin-top: 0.6rem; }
.lira-sr-read-btn {
  background: var(--accent); color: var(--accent-ink); border: none; border-radius: var(--radius);
  padding: 0.5rem 1.1rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: var(--font-body);
}
.lira-sr-read-btn:disabled { opacity: 0.55; cursor: default; }
.lira-sr-learning-toggle-label {
  display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--ink);
  cursor: pointer; user-select: none;
}
.lira-sr-learning-toggle { accent-color: var(--accent); cursor: pointer; margin: 0; }
.lira-sr-hint { color: var(--ink-muted); font-size: 0.76rem; }
.lira-sr-learning-status { color: var(--ink-muted); font-size: 0.72rem; font-family: var(--font-mono); margin-left: auto; }
.lira-sr-examples { display: flex; flex-wrap: wrap; gap: 0.35rem 0.5rem; margin-top: 0.6rem; }
.lira-sr-example {
  background: none; border: 1px solid var(--line); border-radius: 999px; padding: 0.15rem 0.6rem;
  font-size: 0.72rem; color: var(--ink-muted); cursor: pointer; font-family: var(--font-body);
}
.lira-sr-example:hover { border-color: var(--accent); color: var(--accent); }
.lira-sr-error {
  background: color-mix(in srgb, #B2542D 12%, var(--surface));
  border: 1px solid #B2542D; color: #B2542D; border-radius: var(--radius); padding: 0.55rem 0.8rem; font-size: 0.85rem;
}
.lira-sr-workspace { display: flex; gap: 1rem; align-items: flex-start; flex-wrap: wrap; }
.lira-sr-tree-panel {
  flex: 1 1 240px; max-width: 300px; min-width: 220px;
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 0.9rem 1rem;
}
.lira-sr-tree-panel h3 { font-family: var(--font-display); font-size: 0.98rem; margin: 0 0 0.2rem; font-weight: 600; }
.lira-sr-panels { flex: 3 1 520px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; align-items: start; }
.lira-sr-panel {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 0.9rem 1rem; min-width: 0;
}
.lira-sr-panel h3 { font-family: var(--font-display); font-size: 0.98rem; margin: 0 0 0.2rem; font-weight: 600; }
.lira-sr-trace-heading { margin-top: 0.9rem; padding-top: 0.8rem; border-top: 1px solid var(--line); }
.lira-sr-panel-sub { color: var(--ink-muted); font-size: 0.76rem; margin: 0 0 0.8rem; }
.lira-sr-placeholder, .lira-sr-empty { color: var(--ink-muted); font-size: 0.84rem; font-style: italic; }
.lira-sr-strong { font-weight: 700; font-size: 0.82rem; }
.lira-sr-faint { font-size: 0.72rem; color: var(--ink-muted); }
.lira-sr-mono { font-family: var(--font-mono); }
.lira-sr-winner { font-size: 0.72rem; color: var(--accent); margin-left: auto; }
.lira-sr-badge {
  display: inline-flex; align-items: center; padding: 0.05rem 0.55rem; border-radius: 999px;
  font-size: 0.66rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: #fff;
}
.lira-sr-pos-chip {
  display: inline-flex; flex-direction: column; align-items: center; padding: 0.22rem 0.5rem 0.28rem;
  border-radius: 5px; color: #fff; font-family: var(--font-mono); margin: 0.1rem 0.2rem 0.1rem 0;
}
.lira-sr-pos-chip .w { font-size: 0.85rem; font-weight: 600; }
.lira-sr-pos-chip .p { font-size: 0.56rem; opacity: 0.88; letter-spacing: 0.03em; }
.lira-sr-clause-head { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.lira-sr-sentence { font-size: 1.05rem; line-height: 2.1; }
.lira-sr-word {
  position: relative; border-bottom: 1px dotted var(--ink-muted); cursor: pointer;
}
.lira-sr-word.lira-sr-word-unfound {
  border-bottom-style: dashed; border-bottom-color: #B8860B;
  background: color-mix(in srgb, #F5C518 45%, var(--surface));
  border-radius: 3px; padding: 0 0.15rem;
}
.lira-sr-word-tooltip {
  position: absolute; left: 50%; bottom: calc(100% + 7px); transform: translate(-50%, 4px);
  width: max-content; max-width: 270px; background: var(--ink); color: var(--ground);
  font-size: 0.74rem; line-height: 1.4; padding: 0.5rem 0.6rem; border-radius: 5px;
  box-shadow: var(--shadow); opacity: 0; pointer-events: none;
  transition: opacity 0.12s ease, transform 0.12s ease; z-index: 5;
}
.lira-sr-word-tooltip .tt-title { display: block; font-family: var(--font-mono); font-weight: 700; margin-bottom: 0.15rem; }
.lira-sr-word-tooltip .tt-meta { display: block; opacity: 0.85; }
.lira-sr-word-tooltip .tt-meta + .tt-meta { margin-top: 0.1rem; }
.lira-sr-word:hover .lira-sr-word-tooltip, .lira-sr-word:focus .lira-sr-word-tooltip, .lira-sr-word:focus-visible .lira-sr-word-tooltip {
  opacity: 1; transform: translate(-50%, 0);
}
.lira-sr-errors { margin-top: 0.5rem; font-size: 0.78rem; }
.lira-sr-error-row { padding: 0.35rem 0.55rem; border-left: 3px solid #B2542D; background: color-mix(in srgb, #B2542D 8%, transparent); margin-bottom: 0.35rem; border-radius: 3px; }
.lira-sr-position { border: 1px solid var(--line); border-radius: var(--radius); margin-bottom: 0.65rem; overflow: hidden; }
.lira-sr-position-head { padding: 0.45rem 0.65rem; background: color-mix(in srgb, var(--accent) 7%, var(--surface)); display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; }
.lira-sr-winner-pos { padding: 0.4rem 0.65rem 0.5rem; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; border-bottom: 1px solid var(--line); }
.lira-sr-trace-tokens { margin-top: 0.35rem; display: flex; flex-wrap: wrap; }
.lira-sr-attempt { padding: 0.45rem 0.65rem; border-top: 1px solid var(--line); font-size: 0.78rem; }
.lira-sr-attempt.rejected { opacity: 0.62; }
.lira-sr-attempt-head { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.lira-sr-attempt-type { font-weight: 700; font-family: var(--font-mono); font-size: 0.74rem; }
.lira-sr-match-mark { font-size: 0.66rem; padding: 0.05rem 0.4rem; border-radius: 999px; font-weight: 700; }
.lira-sr-match-mark.yes { background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); }
.lira-sr-match-mark.no { background: color-mix(in srgb, var(--ink-muted) 15%, transparent); color: var(--ink-muted); }
.lira-sr-completion { margin-top: 0.3rem; padding: 0.3rem 0.5rem; border-radius: 4px; background: var(--ground); border: 1px solid var(--line); font-size: 0.76rem; }
.lira-sr-completion.winner { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--ground)); }
.lira-sr-win-mark { color: var(--accent); font-weight: 700; margin-right: 0.3rem; }
.lira-sr-rejection { color: var(--ink-muted); font-size: 0.74rem; margin-top: 0.2rem; }

/* Document structure tree -- same recursive-list shape as vocabulary/
   ui/dictionary_view.ts's own .hierarchy-tree (dashed guide lines,
   indentation via padding-left on nested <ul>s), the same fold chevron
   as knowledge/ui/service_status_view.ts's own collapsible panel. */
.lira-tree-root, .lira-tree-root ul { list-style: none; margin: 0; padding: 0; }
.lira-tree-root ul { padding-left: 20px; border-left: 1px dashed var(--line-strong); margin-left: 8px; }
.lira-tree-node { padding: 2px 0; }
.lira-tree-row {
  display: flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.3rem; border-radius: 4px;
  cursor: default; font-size: 0.82rem;
}
.lira-tree-row[data-kind="sentence"] { cursor: pointer; }
.lira-tree-row[data-kind="sentence"]:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.lira-tree-row[data-kind="sentence"]:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.lira-tree-row.selected {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  outline: 1px solid var(--accent);
}
.lira-tree-toggle, .lira-tree-spacer {
  flex: none; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;
}
.lira-tree-toggle {
  background: none; border: none; padding: 0; cursor: pointer; color: var(--ink-faint); transition: transform 0.15s ease;
}
.lira-tree-toggle svg { width: 11px; height: 11px; }
.lira-tree-toggle[aria-expanded="false"] { transform: rotate(-90deg); }
.lira-tree-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.lira-tree-label { font-weight: 600; white-space: nowrap; }
.lira-tree-summary, .lira-tree-snippet { color: var(--ink-muted); font-size: 0.74rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lira-tree-snippet { font-style: italic; }
.lira-tree-error-count {
  margin-left: auto; flex: none; background: #B2542D; color: #fff; font-size: 0.62rem; font-weight: 700;
  padding: 0.02rem 0.4rem; border-radius: 999px;
}
.lira-tree-heading-pill {
  flex: none; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.03em; color: var(--ink-muted);
  background: var(--surface-2); padding: 0.02rem 0.4rem; border-radius: 4px; font-family: var(--font-mono);
}

/* Winner summary card. */
.lira-sr-winner-head { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.lira-sr-winner-roles { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.3rem; }
.lira-sr-winner-role-row {
  display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; padding: 0.2rem 0.4rem;
  background: var(--ground); border: 1px solid var(--line); border-radius: 4px; flex-wrap: wrap;
}
.lira-sr-winner-role-label {
  flex: none; min-width: 72px; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.02em;
  text-transform: uppercase; color: var(--ink-muted);
}
.lira-sr-winner-positions { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.4rem; }
.lira-sr-winner-chip {
  display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.15rem 0.45rem; border-radius: 999px;
  background: var(--ground); border: 1px solid var(--line); font-size: 0.72rem;
}
`;
