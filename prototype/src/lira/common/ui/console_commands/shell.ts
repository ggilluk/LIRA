/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/shell
 * │ Filename        │ shell.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ The Console's shell layer: splits a command line with quotes and
 * │                 │ escapes, and expands filename wildcards (* ? [...]) against the
 * │                 │ virtual filesystem before a command runs.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/shell
 * @file shell.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { VirtualFileSystem } from "../../data/virtual_file_system";

/** One word of a command line after quote removal -- `text` is the
 * word itself; `pattern` is the same word as a glob pattern, with every
 * character that was quoted or backslash-escaped escaped again with a
 * `\`, so only the unquoted `*`/`?`/`[` in it act as wildcards;
 * `isGlob` says whether there is one at all. */
export interface ShellWord {
  text: string;
  pattern: string;
  isGlob: boolean;
}

const GLOB_SPECIAL = new Set(["*", "?", "[", "]", "\\"]);

/** Splits a command line into words the way a POSIX shell does, minus
 * the parts this Console has no use for (variables, command
 * substitution, pipes):
 * - whitespace separates words;
 * - `'...'` quotes everything literally;
 * - `"..."` quotes everything except `\"` and `\\`;
 * - outside quotes, `\x` is a literal `x`;
 * - quoted and unquoted pieces next to each other join into one word
 *   (`"a b"c` is `a bc`).
 * Throws bash's own message for an unclosed quote. */
export function splitWords(input: string): ShellWord[] {
  const words: ShellWord[] = [];
  let text = "";
  let pattern = "";
  let isGlob = false;
  let inWord = false;
  const literal = (ch: string) => {
    text += ch;
    pattern += GLOB_SPECIAL.has(ch) ? `\\${ch}` : ch;
  };
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      if (inWord) words.push({ text, pattern, isGlob });
      text = pattern = "";
      isGlob = inWord = false;
      continue;
    }
    inWord = true;
    if (ch === "'" || ch === '"') {
      const close = ch;
      let j = i + 1;
      for (; j < input.length && input[j] !== close; j++) {
        if (close === '"' && input[j] === "\\" && (input[j + 1] === '"' || input[j + 1] === "\\")) j++;
        literal(input[j]);
      }
      if (j >= input.length) throw new Error(`lira: unexpected EOF while looking for matching \`${close}'`);
      i = j;
    } else if (ch === "\\" && i + 1 < input.length) {
      literal(input[++i]);
    } else {
      text += ch;
      pattern += ch;
      if (ch === "*" || ch === "?" || ch === "[") isGlob = true;
    }
  }
  if (inWord) words.push({ text, pattern, isGlob });
  return words;
}

/** Every path in `fs` that glob `pattern` matches, sorted, written the
 * way the pattern was (relative patterns give relative paths) -- bash's
 * own pathname expansion:
 * - `*` matches any run of characters, `?` any one, `[abc]`/`[a-z]` one
 *   of a set, `[!abc]`/`[^abc]` one not in it;
 * - wildcards never match `/`, so each path segment matches on its own;
 * - a name starting with `.` matches only a segment that itself starts
 *   with a literal `.` (`*` skips hidden files, `.*` finds them);
 * - a trailing `/` matches directories only.
 * Empty when nothing matches; the caller decides what that means. */
export function expandGlob(fs: VirtualFileSystem, pattern: string): string[] {
  const absolute = pattern.startsWith("/");
  const directoriesOnly = pattern.endsWith("/");
  const segments = splitPattern(pattern).filter((segment) => segment !== "");
  let paths = [absolute ? "/" : ""];
  for (const segment of segments) {
    const next: string[] = [];
    for (const base of paths) {
      if (!hasWildcard(segment)) {
        next.push(join(base, unescape(segment)));
        continue;
      }
      const matcher = segmentMatcher(segment);
      let names: readonly string[];
      try {
        if (fs.stat(base === "" ? "." : base).kind !== "dir") continue;
        names = fs.list(base === "" ? "." : base).map((entry) => entry.name);
      } catch {
        continue;
      }
      for (const name of names) if (matcher(name)) next.push(join(base, name));
    }
    paths = next;
  }
  return paths
    .filter((path) => {
      try {
        const kind = fs.stat(path).kind;
        return !directoriesOnly || kind === "dir";
      } catch {
        return false;
      }
    })
    .map((path) => (directoriesOnly ? `${path}/` : path))
    .sort((a, b) => a.localeCompare(b));
}

/** A command line as the command's own argument list: words split and
 * unquoted (`splitWords()`), then every unquoted glob replaced by the
 * paths it matches (`expandGlob()`). A glob that matches nothing is
 * passed through as typed, bash's own default. A glob after an
 * unquoted `>`/`>>` must name exactly one file, or the line is refused
 * as an ambiguous redirect, as bash refuses it. */
export function parseCommandLine(input: string, fs: VirtualFileSystem): string[] {
  const words = splitWords(input);
  const args: string[] = [];
  words.forEach((word, i) => {
    if (!word.isGlob) {
      args.push(word.text);
      return;
    }
    const matches = expandGlob(fs, word.pattern);
    const previous = words[i - 1];
    const isRedirectTarget = previous !== undefined && (previous.pattern === ">" || previous.pattern === ">>");
    if (isRedirectTarget && matches.length > 1) throw new Error(`lira: ${word.text}: ambiguous redirect`);
    if (matches.length === 0) args.push(word.text);
    else args.push(...matches);
  });
  return args;
}

/** `pattern` split on its unescaped `/`s. */
function splitPattern(pattern: string): string[] {
  const segments: string[] = [];
  let current = "";
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "\\" && i + 1 < pattern.length) {
      current += pattern[i] + pattern[++i];
    } else if (pattern[i] === "/") {
      segments.push(current);
      current = "";
    } else {
      current += pattern[i];
    }
  }
  segments.push(current);
  return segments;
}

function hasWildcard(segment: string): boolean {
  for (let i = 0; i < segment.length; i++) {
    if (segment[i] === "\\") i++;
    else if (segment[i] === "*" || segment[i] === "?" || segment[i] === "[") return true;
  }
  return false;
}

function unescape(segment: string): string {
  return segment.replace(/\\(.)/g, "$1");
}

function join(base: string, name: string): string {
  if (base === "") return name;
  return base.endsWith("/") ? `${base}${name}` : `${base}/${name}`;
}

/** One pattern segment as a name test: the segment compiled to an
 * anchored RegExp, plus the leading-dot rule. An unclosed `[` is a
 * literal `[`, as in bash. */
function segmentMatcher(segment: string): (name: string) => boolean {
  let source = "";
  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];
    if (ch === "\\" && i + 1 < segment.length) {
      source += escapeRegExp(segment[++i]);
    } else if (ch === "*") {
      source += ".*";
    } else if (ch === "?") {
      source += ".";
    } else if (ch === "[") {
      const close = classEnd(segment, i);
      if (close === -1) {
        source += "\\[";
        continue;
      }
      let body = segment.slice(i + 1, close);
      const negated = body.startsWith("!") || body.startsWith("^");
      if (negated) body = body.slice(1);
      source += `[${negated ? "^" : ""}${body.replace(/\\(.)/g, "$1").replace(/[\\\]^]/g, (c, offset) => (c === "^" && offset > 0 ? c : `\\${c}`))}]`;
      i = close;
    } else {
      source += escapeRegExp(ch);
    }
  }
  const regex = new RegExp(`^${source}$`, "s");
  const allowsHidden = segment.startsWith(".") || segment.startsWith("\\.");
  return (name) => (allowsHidden || !name.startsWith(".")) && regex.test(name);
}

/** The index of the `]` closing the class that opens at `open`, or -1
 * -- a `]` right after `[` (or `[!`) is a member, not the close. */
function classEnd(segment: string, open: number): number {
  let i = open + 1;
  if (segment[i] === "!" || segment[i] === "^") i++;
  if (segment[i] === "]") i++;
  for (; i < segment.length; i++) {
    if (segment[i] === "\\") i++;
    else if (segment[i] === "]") return i;
  }
  return -1;
}

function escapeRegExp(ch: string): string {
  return /[.*+?^${}()|[\]\\/-]/.test(ch) ? `\\${ch}` : ch;
}
