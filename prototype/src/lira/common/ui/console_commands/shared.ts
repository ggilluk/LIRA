/** `mkdir`/`touch`/`cat`/`rm`'s own shared "keep going across multiple
 * operands" loop -- real bash doesn't abort `rm a b c` just because `a`
 * doesn't exist; it prints that one operand's own error and still
 * removes `b`/`c`. Each of those four commands calls `action(path)` for
 * every path in turn, catching per-path so one failure never swallows
 * the rest -- `ConsoleCommand.run()`'s own return-lines-not-throw
 * convention (types.ts) applies to the whole command, so a caught
 * per-operand error becomes one more returned line, not a thrown
 * exception. */
export function forEachOperand(paths: readonly string[], action: (path: string) => void): string[] {
  const lines: string[] = [];
  for (const path of paths) {
    try {
      action(path);
    } catch (error) {
      lines.push(error instanceof Error ? error.message : String(error));
    }
  }
  return lines;
}
