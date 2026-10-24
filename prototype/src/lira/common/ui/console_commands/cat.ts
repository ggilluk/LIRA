import type { ConsoleCommand } from "./types";

/** Doesn't reuse `shared.ts`'s own `forEachOperand()` -- that helper
 * only keeps per-operand *errors*, discarding whatever a successful
 * call returned, which is exactly the one thing `cat` needs to keep:
 * each file's own content, in argument order, interleaved with any
 * error lines a failed operand produces along the way (real bash's own
 * `cat a b c` behaviour when `b` doesn't exist -- `a` and `c` still
 * print). */
export const catCommand: ConsoleCommand = {
  name: "cat",
  description: "print file contents",
  run: ({ fs, args }) => {
    if (args.length === 0) throw new Error("cat: missing operand");
    const lines: string[] = [];
    for (const path of args) {
      try {
        lines.push(fs.readFile(path));
      } catch (error) {
        lines.push(error instanceof Error ? error.message : String(error));
      }
    }
    return lines;
  },
};
