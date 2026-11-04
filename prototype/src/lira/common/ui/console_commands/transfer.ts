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
 * │ Module Name     │ lira/common/ui/console_commands/transfer
 * │ Filename        │ transfer.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Operand handling shared by cp and mv: SOURCE DEST or SOURCE...
 * │                 │ DIRECTORY, with -n (no clobber) and -v (verbose).
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/transfer
 * @file transfer.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import type { VirtualFileSystem } from "../../data/virtual_file_system";
import { commandWithOptions, type OptionSpec } from "./options";
import { basename, joinPath } from "./shared";

/** `cp`'s and `mv`'s shared GNU operand handling: `SOURCE DEST`, or
 * `SOURCE... DIRECTORY` when there is more than one source (what a
 * wildcard like `*.txt` usually produces), where DIRECTORY must already
 * be one. `-n` skips any source whose destination already exists; `-v`
 * reports each transfer. Each source is handled on its own, so one bad
 * source doesn't stop the rest. */
export function transferCommand(definition: {
  name: "cp" | "mv";
  description: string;
  summary: string;
  options: readonly OptionSpec[];
  verb: (source: string, destination: string) => string;
  transfer: (fs: VirtualFileSystem, source: string, target: string, flags: ReadonlySet<string>) => void;
}): ConsoleCommand {
  return commandWithOptions({
    name: definition.name,
    description: definition.description,
    usage: "[OPTION]... SOURCE... DEST",
    summary: definition.summary,
    options: [
      ...definition.options,
      { name: "noClobber", short: "n", long: "no-clobber", description: "do not overwrite an existing file" },
      { name: "verbose", short: "v", long: "verbose", description: "explain what is being done" },
    ],
    run: ({ fs, flags, operands }) => {
      const name = definition.name;
      if (operands.length === 0) throw new Error(`${name}: missing file operand`);
      if (operands.length === 1) throw new Error(`${name}: missing destination file operand after '${operands[0]}'`);
      const sources = operands.slice(0, -1);
      const target = operands[operands.length - 1];
      const kindOf = (path: string) => {
        try {
          return fs.stat(path).kind;
        } catch {
          return undefined;
        }
      };
      const targetIsDirectory = kindOf(target) === "dir";
      if (sources.length > 1 && !targetIsDirectory) throw new Error(`${name}: target '${target}' is not a directory`);
      const lines: string[] = [];
      for (const source of sources) {
        const destination = targetIsDirectory ? joinPath(target, basename(source)) : target;
        try {
          if (flags.has("noClobber") && kindOf(source) !== undefined && kindOf(destination) !== undefined) continue;
          definition.transfer(fs, source, target, flags);
          if (flags.has("verbose")) lines.push(definition.verb(source, destination));
        } catch (error) {
          lines.push(error instanceof Error ? error.message : String(error));
        }
      }
      return lines;
    },
  });
}
