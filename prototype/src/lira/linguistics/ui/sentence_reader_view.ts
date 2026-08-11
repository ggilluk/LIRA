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
  JsonReadingError,
  JsonSentence,
  PredictedWord,
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
  }

  private async read(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || this.reading) return;
    const token = ++this.requestToken;
    this.reading = true;
    this.setBusy(true);
    this.setError(undefined);
    try {
      const result = await this.client.read(trimmed);
      if (token !== this.requestToken || !this.container) return;
      this.renderResult(result);
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
    button.textContent = busy ? "Reading…" : "Read sentence";
  }

  private setError(message: string | undefined): void {
    const banner = this.container?.querySelector<HTMLElement>(".lira-sr-error");
    if (!banner) return;
    banner.textContent = message ?? "";
    banner.style.display = message ? "block" : "none";
  }

  private renderResult(result: ReadResult): void {
    const predicted = this.container?.querySelector<HTMLElement>(".lira-sr-predicted");
    const trace = this.container?.querySelector<HTMLElement>(".lira-sr-trace");
    if (predicted) predicted.innerHTML = this.renderPredicted(result.predicted, result.words);
    if (trace) trace.innerHTML = this.renderTrace(result.trace);
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
            <button type="button" class="lira-sr-read-btn">Read sentence</button>
            <span class="lira-sr-hint">or press &#8984;/Ctrl + Enter</span>
          </div>
          <div class="lira-sr-examples">
            ${QUICK_EXAMPLES.map((example) => `<button type="button" class="lira-sr-example" data-example="${escapeHtml(example)}">${escapeHtml(example)}</button>`).join("")}
          </div>
        </div>
        <div class="lira-sr-error" style="display:none"></div>
        <div class="lira-sr-panels">
          <section class="lira-sr-panel">
            <h3>Predicted structure</h3>
            <p class="lira-sr-panel-sub">The one interpretation the state machine ranked highest and materialised.</p>
            <div class="lira-sr-predicted"><div class="lira-sr-placeholder">Read a sentence to see its predicted structure.</div></div>
          </section>
          <section class="lira-sr-panel">
            <h3>Full trace — word prediction</h3>
            <p class="lira-sr-panel-sub">Every phrase type the state machine tried at every token position — matched, completed, rejected, and why.</p>
            <div class="lira-sr-trace"><div class="lira-sr-placeholder">Read a sentence to see the full search trace.</div></div>
          </section>
        </div>
      </div>
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

/** The `.def-tooltip`-shaped popup: word text as the title line, then a
 * meta line with validation/part-of-speech/confidence -- or, for an
 * unresolved word, the same honest "not found" wording
 * dictionary_view.ts's own unresolved `.def-word` tooltip uses, since
 * there is no committed reading to report a POS/confidence for. */
function renderWordTooltip(word: PredictedWord): string {
  if (!word.resolved) {
    return `<span class="lira-sr-word-tooltip"><span class="tt-title">${escapeHtml(word.text)}</span><span class="tt-meta">Not found in the Common Vocabulary Cache</span></span>`;
  }
  const meta = [word.validation ?? "UNRESOLVED", word.partOfSpeech ?? "?", `conf ${word.confidence !== null ? word.confidence.toFixed(2) : "—"}`];
  return `<span class="lira-sr-word-tooltip"><span class="tt-title">${escapeHtml(word.text)}</span><span class="tt-meta">${meta.map(escapeHtml).join(" · ")}</span></span>`;
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

// Assumes the Portal shell's own --ground/--surface/--surface-2/--ink/
// --ink-muted/--ink-faint/--accent/--accent-ink/--line/--line-strong/
// --shadow/--radius/--font-display/--font-body/--font-mono tokens exist
// on an ancestor element (knowledge/ui/portal_shell.ts's own SHELL_CSS)
// -- the same "shared chrome, defined once" contract DictionaryView's
// fragment CSS assumes, but this stylesheet was authored against that
// contract from the outset rather than extracted from a standalone
// page, so there's no separate --surface-2/--ink-faint fallback pass to
// reconcile. `.lira-sr-panels` reflows via `auto-fit`/`minmax`, not a
// viewport media query, so it stacks correctly at the Portal pane's own
// (narrower-than-viewport) width.
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
.lira-sr-hint { color: var(--ink-muted); font-size: 0.76rem; }
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
.lira-sr-panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; align-items: start; }
.lira-sr-panel {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 0.9rem 1rem; min-width: 0;
}
.lira-sr-panel h3 { font-family: var(--font-display); font-size: 0.98rem; margin: 0 0 0.2rem; font-weight: 600; }
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
  width: max-content; max-width: 240px; background: var(--ink); color: var(--ground);
  font-size: 0.74rem; line-height: 1.4; padding: 0.5rem 0.6rem; border-radius: 5px;
  box-shadow: var(--shadow); opacity: 0; pointer-events: none;
  transition: opacity 0.12s ease, transform 0.12s ease; z-index: 5;
}
.lira-sr-word-tooltip .tt-title { display: block; font-family: var(--font-mono); font-weight: 700; margin-bottom: 0.15rem; }
.lira-sr-word-tooltip .tt-meta { display: block; opacity: 0.85; }
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
`;
