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
 * │ Module Name     │ lira/common/ui/console_commands/stat
 * │ Filename        │ stat.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `stat` command: shows each path's size, kind, media type
 * │                 │ and character set.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/stat
 * @file stat.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import { forEachOperand } from "./shared";

/** `stat path...` -- each path's own size, kind, and (for a file) the
 * media type and character set its BinaryObject content declares. Real
 * `stat`'s inode/permission/timestamp lines are left out: this
 * filesystem has none of those. */
export const statCommand: ConsoleCommand = {
  name: "stat",
  description: "show a file's size, kind, media type and character set",
  run: ({ fs, args }) => {
    if (args.length === 0) throw new Error("stat: missing operand");
    const lines: string[] = [];
    const errors = forEachOperand(args, (path) => {
      const stat = fs.stat(path);
      lines.push(`  File: ${path}`);
      lines.push(`  Size: ${stat.size}\t${stat.kind === "dir" ? "directory" : stat.size === 0 ? "regular empty file" : "regular file"}`);
      if (stat.mimeCode) lines.push(`  Type: ${stat.mimeCode.value}${stat.mimeCode.isRegistered ? "" : " (not IANA-registered)"}`);
      if (stat.characterSetCode) lines.push(`Charset: ${stat.characterSetCode.labels()[0]} (IANA ${stat.characterSetCode.value})`);
    });
    return [...lines, ...errors];
  },
};
