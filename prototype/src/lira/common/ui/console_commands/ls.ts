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
 * │ Description     │ Console `ls` command: lists a directory, or with -l one entry per
 * │                 │ line with type, size and media type.
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

/** Lists one directory (defaults to the working directory,
 * `VirtualFileSystem.list()`'s own docstring). Short form: one line,
 * entries space-joined with a trailing `/` on each directory, since the
 * Console's own scrollback is narrow and `white-space: pre-wrap` wraps
 * a long joined line cleanly. `-l` (any dash-bundle containing `l`,
 * `rm`'s own loose flag matching) prints one entry per line instead:
 * type, size in bytes, media type (`-` when the file has none), and
 * name -- the columns this filesystem actually has, in place of real
 * `ls -l`'s permissions/owner/date ones it doesn't. */
export const lsCommand: ConsoleCommand = {
  name: "ls",
  description: "list directory contents (-l for sizes and media types)",
  run: ({ fs, args }) => {
    const long = args.some((arg) => arg.startsWith("-") && arg.includes("l"));
    const path = args.find((arg) => !arg.startsWith("-"));
    const entries = fs.list(path);
    if (!long) return entries.length === 0 ? [] : [entries.map((entry) => (entry.kind === "dir" ? `${entry.name}/` : entry.name)).join("  ")];

    const target = path ?? ".";
    const targetIsFile = fs.stat(target).kind === "file";
    return entries.map((entry) => {
      const stat = fs.stat(targetIsFile ? target : `${target}/${entry.name}`);
      const type = entry.kind === "dir" ? "d" : "-";
      return `${type} ${String(stat.size).padStart(8)}  ${(stat.mimeCode?.value ?? "-").padEnd(24)} ${entry.kind === "dir" ? `${entry.name}/` : entry.name}`;
    });
  },
};
