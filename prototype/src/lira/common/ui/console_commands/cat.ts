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
 * │ Module Name     │ lira/common/ui/console_commands/cat
 * │ Filename        │ cat.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-11-02
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `cat` command: prints files decoded in their own
 * │                 │ character sets, with -n, -b and -E, and a notice for binary
 * │                 │ content.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/cat
 * @file cat.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import { commandWithOptions } from "./options";
import { decodeText } from "./shared";

/** Each file's own content, in argument order, interleaved with any
 * error line a failed operand produces along the way (real `cat a b c`
 * when `b` doesn't exist -- `a` and `c` still print), so it can't reuse
 * `shared.ts`'s own `forEachOperand()`, which keeps only errors. Each
 * file is decoded the way its own metadata says (`decodeText()`,
 * shared.ts). A real `cat` copies raw bytes and leaves decoding to the
 * terminal; this Console has no terminal layer to do that, so a file
 * that isn't text gets a one-line notice instead of garbage. `-n`/`-b`
 * number lines (continuing across files, as GNU `cat` does, since it
 * numbers the concatenation), and `-E` marks each line end with `$`. */
export const catCommand: ConsoleCommand = commandWithOptions({
  name: "cat",
  description: "print file contents",
  usage: "[OPTION]... [FILE]...",
  summary: "Concatenate FILE(s) to the console.",
  options: [
    { name: "numberNonblank", short: "b", long: "number-nonblank", description: "number nonempty output lines, overrides -n" },
    { name: "showEnds", short: "E", long: "show-ends", description: "display $ at end of each line" },
    { name: "number", short: "n", long: "number", description: "number all output lines" },
  ],
  run: ({ fs, flags, operands }) => {
    if (operands.length === 0) throw new Error("cat: missing operand");
    const numbering = flags.has("numberNonblank") ? "nonblank" : flags.has("number") ? "all" : undefined;
    const perLine = numbering !== undefined || flags.has("showEnds");
    let lineNumber = 0;
    const lines: string[] = [];
    for (const path of operands) {
      let text: string;
      try {
        const decoded = decodeText(fs.readFile(path));
        if (!("text" in decoded)) {
          lines.push(`cat: ${path}: ${decoded.problem}, not shown`);
          continue;
        }
        text = decoded.text;
      } catch (error) {
        lines.push(`cat: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      if (!perLine) {
        lines.push(text);
        continue;
      }
      const fileLines = text.endsWith("\n") ? text.slice(0, -1).split("\n") : text.split("\n");
      for (const line of fileLines) {
        const numbered = numbering === "all" || (numbering === "nonblank" && line !== "") ? `${String(++lineNumber).padStart(6)}\t` : "";
        lines.push(`${numbered}${line}${flags.has("showEnds") ? "$" : ""}`);
      }
    }
    return lines;
  },
});
