import { VirtualFileSystem } from "../data/virtual_file_system";
import { CONSOLE_COMMANDS } from "./console_commands";

/** ConsoleView: a terminal-styled command console for the Vocabulary
 * view pane, mounted directly above ServiceStatusView's own Background
 * Services panel (PortalShell's own renderViewPane()/render() call
 * sites, service_status_view.ts's own `mount()`/`ensureStyles()`
 * pattern mirrored here).
 *
 * Real commands, not just a scaffold any more -- every command this
 * Console runs lives in its own file under `./console_commands/`
 * (`ConsoleCommand`'s own docstring there), dispatched through
 * `CONSOLE_COMMANDS` by name; an unrecognised name still echoes back
 * "command not found... (not implemented yet)" rather than silently
 * doing nothing. `fs`, one `VirtualFileSystem` instance
 * (common/data/virtual_file_system.ts) this whole Console session
 * shares, is the one piece of state every filesystem command reads and
 * writes -- a real, bash-shaped in-memory filesystem, not just output
 * text.
 *
 * Self-contained the same way ServiceStatusView is: owns its own DOM
 * subtree, its own `<style>` injection, its own collapsed/history/
 * filesystem state as instance fields (not re-derived from the DOM,
 * which PortalShell rebuilds from scratch on every one of its own
 * renders -- `ServiceStatusView`'s own docstring on why that
 * matters). */
export class ConsoleView {
  private container: HTMLElement | undefined;
  private collapsed = false;
  private readonly fs = new VirtualFileSystem();
  private lines: ConsoleLine[] = [{ kind: "output", text: "LIRA Console — type 'help' to get started." }];
  /** Every command actually submitted (Enter pressed on a non-empty,
   * non-whitespace line), oldest first -- ArrowUp/ArrowDown recall this
   * the same way a real shell's own history does, newest entry first on
   * the first ArrowUp press. */
  private commandHistory: string[] = [];
  /** Where ArrowUp/ArrowDown navigation currently sits in
   * `commandHistory` -- `undefined` means "not currently recalling
   * anything, the input holds whatever the user is actively typing".
   * `commandHistory.length` itself (one past the last real entry) is
   * the "recalled past the newest entry, back to the user's own
   * in-progress draft" position ArrowDown lands back on. */
  private historyIndex: number | undefined;
  /** The input's own live value at the moment ArrowUp first left "not
   * currently recalling" -- restored verbatim if the user arrows back
   * down past every history entry, so recalling history and then
   * backing out of it again never loses what they'd already typed. */
  private draftBeforeRecall = "";

  mount(container: HTMLElement): void {
    this.container = container;
    this.ensureStyles();
    container.addEventListener("click", (event) => this.handleClick(event));
    container.addEventListener("keydown", (event) => this.handleKeydown(event as KeyboardEvent));
    this.paint();
  }

  private paint(): void {
    if (!this.container) return;
    this.container.innerHTML = this.renderPanel();
    this.focusInput();
    this.scrollToBottom();
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest<HTMLElement>("[data-action='toggle-console']")) {
      this.collapsed = !this.collapsed;
      this.paint();
      return;
    }
    // Clicking anywhere else in the terminal body (not the header, not
    // a link/button some future command's own output might render)
    // refocuses the input -- a real terminal emulator's own "click
    // anywhere to keep typing" feel, rather than requiring a precise
    // click on the one-line input itself.
    if (target.closest<HTMLElement>(".console-body") && !target.closest("a,button")) this.focusInput();
  }

  private handleKeydown(event: KeyboardEvent): void {
    const input = event.target as HTMLElement;
    if (!input.classList.contains("console-input")) return;
    const field = input as HTMLInputElement;

    if (event.key === "Enter") {
      event.preventDefault();
      const value = field.value;
      field.value = "";
      this.historyIndex = undefined;
      this.runCommand(value);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.recall(field, -1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      this.recall(field, 1);
    }
  }

  /** ArrowUp (`direction: -1`)/ArrowDown (`direction: 1`) -- mutates
   * `field.value` directly rather than going through `paint()`: a full
   * re-render would tear down and rebuild the input element itself,
   * losing focus (`paint()`'s own `focusInput()` call would reclaim it,
   * but only after a visible flash) for a change that's purely "what
   * text sits in the one input box", nothing a repaint of the whole
   * scrollback actually needs to happen for. */
  private recall(field: HTMLInputElement, direction: 1 | -1): void {
    if (this.commandHistory.length === 0) return;
    if (this.historyIndex === undefined) {
      if (direction === 1) return; // ArrowDown with nothing recalled yet -- nothing to return to.
      this.draftBeforeRecall = field.value;
      this.historyIndex = this.commandHistory.length - 1;
    } else {
      const next = this.historyIndex + direction;
      if (next < 0) return;
      if (next >= this.commandHistory.length) {
        this.historyIndex = undefined;
        field.value = this.draftBeforeRecall;
        return;
      }
      this.historyIndex = next;
    }
    field.value = this.commandHistory[this.historyIndex];
  }

  /** Submits `raw` -- echoes it as a command line (prefixed with the
   * prompt, PROMPT's own docstring), records it in `commandHistory`
   * unless blank (a bare Enter press shouldn't pollute recall the way
   * a real shell's own history doesn't either), tokenizes it
   * (`tokenize()` below -- whitespace-separated, with `"..."` quoting
   * for an argument containing spaces), and looks the command name up
   * in `CONSOLE_COMMANDS` (console_commands/index.ts). An unrecognised
   * name is echoed back as "not found"; a recognised one runs with a
   * fresh `ConsoleCommandContext` built from this instance's own `fs`
   * and the full registry (`help`'s own listing needs it). A thrown
   * `Error` -- `ConsoleCommand.run()`'s own docstring on why a command
   * throws instead of returning an error line itself -- becomes one
   * error-styled line; a successful run's own returned lines become
   * output-styled ones. A blank `raw` still echoes an empty prompt line
   * -- matches a real terminal's own "Enter alone just advances to a
   * fresh prompt" behaviour -- but records nothing and runs nothing. */
  private runCommand(raw: string): void {
    const trimmed = raw.trim();
    this.lines.push({ kind: "command", text: raw });
    if (trimmed.length === 0) {
      this.paint();
      return;
    }
    this.commandHistory.push(trimmed);

    const [name, ...args] = tokenize(trimmed);
    const command = CONSOLE_COMMANDS[name.toLowerCase()];
    if (!command) {
      this.lines.push({ kind: "error", text: `lira: command not found: ${name} (not implemented yet)` });
      this.paint();
      return;
    }
    try {
      const output = command.run({ fs: this.fs, args, commands: CONSOLE_COMMANDS, clearScrollback: () => (this.lines = []) });
      for (const text of output) this.lines.push({ kind: "output", text });
    } catch (error) {
      this.lines.push({ kind: "error", text: error instanceof Error ? error.message : String(error) });
    }
    this.paint();
  }

  private focusInput(): void {
    this.container?.querySelector<HTMLInputElement>(".console-input")?.focus();
  }

  private scrollToBottom(): void {
    const lines = this.container?.querySelector<HTMLElement>(".console-lines");
    if (lines) lines.scrollTop = lines.scrollHeight;
  }

  private renderPanel(): string {
    return `
      <div class="console-panel ${this.collapsed ? "collapsed" : ""}">
        <button type="button" class="console-header" data-action="toggle-console" aria-expanded="${!this.collapsed}">
          <span class="console-label">Console</span>
          ${this.collapsed ? `<span class="console-summary">${this.commandHistory.length} command${this.commandHistory.length === 1 ? "" : "s"}</span>` : ""}
          <span class="console-chevron">${ICON_CHEVRON}</span>
        </button>
        <div class="console-body" role="log" aria-live="polite">
          <div class="console-lines">
            ${this.lines.map((line) => this.renderLine(line)).join("")}
          </div>
          <div class="console-prompt-row">
            <span class="console-prompt" aria-hidden="true">${PROMPT}</span>
            <input type="text" class="console-input" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Console command input">
          </div>
        </div>
      </div>
    `;
  }

  private renderLine(line: ConsoleLine): string {
    if (line.kind === "command") {
      return `<div class="console-line console-line-command"><span class="console-prompt" aria-hidden="true">${PROMPT}</span>${escapeHtml(line.text)}</div>`;
    }
    return `<div class="console-line console-line-${line.kind}">${escapeHtml(line.text)}</div>`;
  }

  private ensureStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
}

interface ConsoleLine {
  kind: "command" | "output" | "error";
  text: string;
}

const PROMPT = "lira$ ";

/** `runCommand()`'s own input splitter -- whitespace-separated, with
 * `"..."` double-quoting for one argument that itself contains spaces
 * (`echo "hello world"` -> one arg `hello world`, not two). Nothing
 * fancier than that -- single quotes, escaping, and `$VAR`-style
 * expansion are all real bash features this scaffold doesn't attempt
 * (`ConsoleCommand`'s own docstring on "basic commands" being the
 * actual scope here). */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const pattern = /"([^"]*)"|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) tokens.push(match[1] !== undefined ? match[1] : match[2]);
  return tokens;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const ICON_CHEVRON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>`;

const STYLE_ID = "lira-console-styles";
const CSS = `
.console-panel {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: var(--surface, #FFFFFF);
  border-top: 1px solid var(--line, #DDE0DA);
  padding: 0.6rem 0.9rem 0.75rem;
  flex: none;
}
.console-header {
  display: flex; align-items: center; gap: 0.5rem; width: 100%;
  background: none; border: none; padding: 0; margin-bottom: 0.45rem;
  font-family: inherit; cursor: pointer; text-align: left;
}
.console-label {
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 0.64rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint, #8B948E);
}
.console-summary { font-size: 0.72rem; color: var(--ink-muted, #5B6660); flex: 1; }
.console-chevron { display: flex; margin-left: auto; color: var(--ink-faint, #8B948E); transition: transform 0.15s ease; }
.console-chevron svg { width: 12px; height: 12px; }
.console-panel.collapsed .console-header { margin-bottom: 0; }
.console-panel.collapsed .console-chevron { transform: rotate(-90deg); }
.console-panel.collapsed .console-body { display: none; }
.console-header:focus-visible { outline: 2px solid var(--accent, #2B6E63); outline-offset: 2px; }
.console-body {
  display: flex; flex-direction: column;
  background: #14171a; border-radius: 6px; border: 1px solid #272c30;
  padding: 0.55rem 0.7rem;
}
.console-lines {
  max-height: 200px; overflow-y: auto;
  font-family: 'SF Mono', Menlo, monospace; font-size: 0.78rem; line-height: 1.5;
  scrollbar-width: thin; scrollbar-color: #3a4147 transparent;
}
.console-lines::-webkit-scrollbar { width: 8px; }
.console-lines::-webkit-scrollbar-track { background: transparent; }
.console-lines::-webkit-scrollbar-thumb { background: #3a4147; border-radius: 4px; }
.console-lines::-webkit-scrollbar-thumb:hover { background: #4d555c; }
.console-line { white-space: pre-wrap; overflow-wrap: anywhere; color: #c7ccd1; }
.console-line-command { color: #f2f4f6; }
.console-line-error { color: #e0796d; }
.console-prompt { color: #5fe3b3; font-weight: 600; user-select: none; }
.console-prompt-row { display: flex; align-items: center; margin-top: 0.3rem; }
.console-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #f2f4f6; font-family: 'SF Mono', Menlo, monospace; font-size: 0.78rem;
  caret-color: #5fe3b3;
}
`;
