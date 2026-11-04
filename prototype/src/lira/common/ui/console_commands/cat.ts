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
 * │ Description     │ Console `cat` command: prints each file's contents (decoded as
 * │                 │ UTF-8), continuing past failed operands like real bash.
 * │                 │
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

/** Doesn't reuse `shared.ts`'s own `forEachOperand()` -- that helper
 * only keeps per-operand *errors*, discarding whatever a successful
 * call returned, which is exactly the one thing `cat` needs to keep:
 * each file's own content, in argument order, interleaved with any
 * error lines a failed operand produces along the way (real bash's own
 * `cat a b c` behaviour when `b` doesn't exist -- `a` and `c` still
 * print). Each file's own `BinaryObject` bytes are decoded as UTF-8 --
 * `echo`'s own encoding, and the one text encoding this Console
 * writes. */
export const catCommand: ConsoleCommand = {
  name: "cat",
  description: "print file contents",
  run: ({ fs, args }) => {
    if (args.length === 0) throw new Error("cat: missing operand");
    const lines: string[] = [];
    for (const path of args) {
      try {
        lines.push(new TextDecoder().decode(fs.readFile(path).value));
      } catch (error) {
        lines.push(error instanceof Error ? error.message : String(error));
      }
    }
    return lines;
  },
};
