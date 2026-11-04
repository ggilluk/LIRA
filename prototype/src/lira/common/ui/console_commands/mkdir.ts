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
 * │ Module Name     │ lira/common/ui/console_commands/mkdir
 * │ Filename        │ mkdir.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `mkdir` command: creates directories, with -p and -v.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/mkdir
 * @file mkdir.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import { commandWithOptions } from "./options";
import { forEachOperand } from "./shared";

/** `-p` creates every missing parent and is no error when the directory
 * already exists, as GNU `mkdir -p`; `-v` reports each directory
 * created, parents included. Implemented over single-level
 * `makeDirectory()` calls, so every error is still the filesystem's own
 * bash-phrased one. */
export const mkdirCommand: ConsoleCommand = commandWithOptions({
  name: "mkdir",
  description: "create directories",
  usage: "[OPTION]... DIRECTORY...",
  summary: "Create the DIRECTORY(ies), if they do not already exist.",
  options: [
    { name: "parents", short: "p", long: "parents", description: "no error if existing, make parent directories as needed" },
    { name: "verbose", short: "v", long: "verbose", description: "print a message for each created directory" },
  ],
  run: ({ fs, flags, operands }) => {
    if (operands.length === 0) throw new Error("mkdir: missing operand");
    const created: string[] = [];
    const exists = (path: string) => {
      try {
        return fs.stat(path).kind;
      } catch {
        return undefined;
      }
    };
    const errors = forEachOperand(operands, (path) => {
      if (!flags.has("parents")) {
        fs.makeDirectory(path);
        created.push(path);
        return;
      }
      const parts = path.split("/");
      for (let i = 1; i <= parts.length; i++) {
        const prefix = parts.slice(0, i).join("/");
        if (prefix === "" || parts[i - 1] === "" || parts[i - 1] === "." || parts[i - 1] === "..") continue;
        const kind = exists(prefix);
        if (kind === "dir") continue;
        if (kind === "file") throw new Error(`mkdir: cannot create directory '${path}': ${i === parts.length ? "File exists" : "Not a directory"}`);
        fs.makeDirectory(prefix);
        created.push(prefix);
      }
    });
    return [...(flags.has("verbose") ? created.map((path) => `mkdir: created directory '${path}'`) : []), ...errors];
  },
});
