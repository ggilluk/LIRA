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

/** `df`'s and `ps`'s own shared byte formatter -- `df -h`'s own
 * single-letter-suffix shape (`20.0M`, not `20971520`), one decimal
 * place past the first unit it doesn't fit in whole. A `G` tier exists
 * because `ps`'s own `%HEAP` column needs one -- a real
 * `performance.memory.jsHeapSizeLimit` is typically ~4 billion bytes,
 * which without it would print as an unreadable `3814.7M` instead of
 * the `3.7G` a real `df -h`/`ps aux` would show. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`;
}
