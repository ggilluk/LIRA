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
 * │ Module Name     │ lira/common/ui/console_commands/ls
 * │ Filename        │ ls.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `ls` command: lists a directory (default: the working
 * │                 │ directory), marking directories with a trailing /.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/ls
 * @file ls.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";

/** Lists `args[0]` (defaults to the working directory, `VirtualFileSystem.list()`'s
 * own docstring) -- one line, entries space-joined with a trailing `/`
 * on each directory, `ls`'s own short default-column form rather than
 * a one-entry-per-line listing, since the Console's own scrollback is
 * narrow and `white-space: pre-wrap` already wraps a long joined line
 * cleanly. */
export const lsCommand: ConsoleCommand = {
  name: "ls",
  description: "list directory contents",
  run: ({ fs, args }) => {
    const entries = fs.list(args[0]);
    if (entries.length === 0) return [];
    return [entries.map((entry) => (entry.kind === "dir" ? `${entry.name}/` : entry.name)).join("  ")];
  },
};
