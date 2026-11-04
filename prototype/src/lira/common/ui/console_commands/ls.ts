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
 * │ Description     │ Console `ls` command: lists files and directories, with -a, -A,
 * │                 │ -d, -l, -h, -R and -1.
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
import type { FsStat } from "../../data/virtual_file_system";
import { commandWithOptions } from "./options";
import { formatBytes, joinPath } from "./shared";

/** One name to print, with what its long form needs. */
interface Listed {
  name: string;
  stat: FsStat;
}

/** GNU `ls`'s own operand handling, over the columns this filesystem
 * has. Every operand is listed: files (and, with `-d`, directories
 * themselves) first as one group, then each directory's contents under
 * a `path:` header whenever more than one thing is listed or `-R`
 * recurses. Names starting with `.` are hidden unless `-a` (which also
 * lists `.` and `..`) or `-A` (which doesn't). Short form joins names on
 * one line with a trailing `/` on each directory, since the Console's
 * own scrollback is narrow and wraps a long line cleanly; `-1` puts one
 * per line. `-l` prints type, size (`-h` for human-readable), media type
 * (`-` when the file has none) and name -- the columns this filesystem
 * actually has, in place of real `ls -l`'s permission/owner/date ones. */
export const lsCommand: ConsoleCommand = commandWithOptions({
  name: "ls",
  description: "list directory contents",
  usage: "[OPTION]... [FILE]...",
  summary: "List information about the FILEs (the current directory by default).",
  options: [
    { name: "all", short: "a", long: "all", description: "do not ignore entries starting with ." },
    { name: "almostAll", short: "A", long: "almost-all", description: "do not list implied . and .." },
    { name: "directory", short: "d", long: "directory", description: "list directories themselves, not their contents" },
    { name: "human", short: "h", long: "human-readable", description: "with -l, print sizes like 1K 234M 2G" },
    { name: "long", short: "l", description: "use a long listing format" },
    { name: "recursive", short: "R", long: "recursive", description: "list subdirectories recursively" },
    { name: "onePerLine", short: "1", description: "list one file per line" },
  ],
  run: ({ fs, flags, operands }) => {
    const targets = operands.length > 0 ? operands : ["."];
    const errors: string[] = [];
    const files: Listed[] = [];
    const directories: string[] = [];
    for (const target of targets) {
      let stat: FsStat;
      try {
        stat = fs.stat(target);
      } catch {
        errors.push(`ls: cannot access '${target}': No such file or directory`);
        continue;
      }
      if (stat.kind === "dir" && !flags.has("directory")) directories.push(target);
      else files.push({ name: target, stat });
    }

    const format = (entries: readonly Listed[]): string[] => {
      if (entries.length === 0) return [];
      const label = (entry: Listed) => (entry.stat.kind === "dir" ? `${entry.name}/` : entry.name);
      if (flags.has("long")) {
        return entries.map((entry) => {
          const size = flags.has("human") ? formatBytes(entry.stat.size) : String(entry.stat.size);
          return `${entry.stat.kind === "dir" ? "d" : "-"} ${size.padStart(8)}  ${(entry.stat.mimeCode?.value ?? "-").padEnd(24)} ${label(entry)}`;
        });
      }
      return flags.has("onePerLine") ? entries.map(label) : [entries.map(label).join("  ")];
    };

    const contents = (directory: string): Listed[] => {
      const showHidden = flags.has("all") || flags.has("almostAll");
      const entries: Listed[] = fs
        .list(directory)
        .filter((entry) => showHidden || !entry.name.startsWith("."))
        .map((entry) => ({ name: entry.name, stat: fs.stat(joinPath(directory, entry.name)) }));
      if (flags.has("all")) entries.unshift({ name: ".", stat: fs.stat(directory) }, { name: "..", stat: fs.stat(joinPath(directory, "..")) });
      return entries;
    };

    const output: string[] = [...errors];
    const groups: string[][] = [];
    if (files.length > 0) groups.push(format(files));
    const withHeaders = targets.length > 1 || flags.has("recursive");
    const visit = (directory: string) => {
      const entries = contents(directory);
      groups.push([...(withHeaders ? [`${directory}:`] : []), ...format(entries)]);
      if (!flags.has("recursive")) return;
      for (const entry of entries) {
        if (entry.stat.kind === "dir" && entry.name !== "." && entry.name !== "..") visit(joinPath(directory, entry.name));
      }
    };
    for (const directory of directories) visit(directory);
    groups.forEach((group, i) => {
      if (i > 0) output.push("");
      output.push(...group);
    });
    return output;
  },
});
