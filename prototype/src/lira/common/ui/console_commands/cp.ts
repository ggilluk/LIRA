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
 * │ Module Name     │ lira/common/ui/console_commands/cp
 * │ Filename        │ cp.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `cp` command: copies files and directories, with -r/-R,
 * │                 │ -n and -v, including several sources into a directory.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/cp
 * @file cp.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import { transferCommand } from "./transfer";

/** `cp`, over `transfer.ts`'s own shared operand handling; `-r`/`-R`
 * copies directories, which plain `cp` refuses. */
export const cpCommand: ConsoleCommand = transferCommand({
  name: "cp",
  description: "copy files and directories",
  summary: "Copy SOURCE to DEST, or multiple SOURCE(s) to DIRECTORY.",
  options: [
    { name: "recursive", short: "r", long: "recursive", description: "copy directories recursively" },
    { name: "recursive", short: "R", description: "same as -r" },
  ],
  verb: (source, destination) => `'${source}' -> '${destination}'`,
  transfer: (fs, source, target, flags) => fs.copy(source, target, { recursive: flags.has("recursive") }),
});
