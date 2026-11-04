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
 * │ Module Name     │ lira/common/ui/console_commands/mv
 * │ Filename        │ mv.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `mv` command: moves or renames files and directories,
 * │                 │ with -f, -n and -v, including several sources into a directory.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/mv
 * @file mv.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import { transferCommand } from "./transfer";

/** `mv`, over `transfer.ts`'s own shared operand handling. `-f` is
 * accepted and is the default: nothing here ever prompts before
 * overwriting. */
export const mvCommand: ConsoleCommand = transferCommand({
  name: "mv",
  description: "move or rename files and directories",
  summary: "Rename SOURCE to DEST, or move SOURCE(s) to DIRECTORY.",
  options: [{ name: "force", short: "f", long: "force", description: "do not prompt before overwriting (the default)" }],
  verb: (source, destination) => `renamed '${source}' -> '${destination}'`,
  transfer: (fs, source, target) => fs.move(source, target),
});
