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
 * │ Module Name     │ lira/common/ui/console_commands/rm
 * │ Filename        │ rm.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `rm` command: removes files and directories, with -r/-R,
 * │                 │ -d, -f and -v.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/rm
 * @file rm.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import type { VirtualFileSystem } from "../../data/virtual_file_system";
import { commandWithOptions } from "./options";
import { joinPath } from "./shared";

/** GNU `rm`'s own switches. Without `-r`, a directory is refused (or,
 * with `-d`, removed only when empty). `-f` ignores operands that don't
 * exist, and makes no operands at all not an error -- nothing here ever
 * prompts, so that is all "force" changes. `-v` reports each removal,
 * every file inside a directory before the directory itself, as GNU
 * `rm -rv` does. */
export const rmCommand: ConsoleCommand = commandWithOptions({
  name: "rm",
  description: "remove files or directories",
  usage: "[OPTION]... [FILE]...",
  summary: "Remove (unlink) the FILE(s).",
  options: [
    { name: "dir", short: "d", long: "dir", description: "remove empty directories" },
    { name: "force", short: "f", long: "force", description: "ignore nonexistent files, never prompt" },
    { name: "recursive", short: "r", long: "recursive", description: "remove directories and their contents recursively" },
    { name: "recursive", short: "R", description: "same as -r" },
    { name: "verbose", short: "v", long: "verbose", description: "explain what is being done" },
  ],
  run: ({ fs, flags, operands }) => {
    if (operands.length === 0) {
      if (flags.has("force")) return [];
      throw new Error("rm: missing operand");
    }
    const lines: string[] = [];
    for (const path of operands) {
      try {
        let kind: "file" | "dir";
        try {
          kind = fs.stat(path).kind;
        } catch {
          if (flags.has("force")) continue;
          throw new Error(`rm: cannot remove '${path}': No such file or directory`);
        }
        if (kind === "dir" && !flags.has("recursive")) {
          if (!flags.has("dir")) throw new Error(`rm: cannot remove '${path}': Is a directory`);
          if (fs.list(path).length > 0) throw new Error(`rm: cannot remove '${path}': Directory not empty`);
        }
        const removed = flags.has("verbose") ? removalReport(fs, path) : [];
        fs.remove(path, { recursive: kind === "dir" });
        lines.push(...removed);
      } catch (error) {
        lines.push(error instanceof Error ? error.message : String(error));
      }
    }
    return lines;
  },
});

/** `rm -v`'s own lines for removing `path`: depth-first, a directory's
 * contents before the directory. */
function removalReport(fs: VirtualFileSystem, path: string): string[] {
  if (fs.stat(path).kind === "file") return [`removed '${path}'`];
  const lines: string[] = [];
  for (const entry of fs.list(path)) lines.push(...removalReport(fs, joinPath(path, entry.name)));
  lines.push(`removed directory '${path}'`);
  return lines;
}
