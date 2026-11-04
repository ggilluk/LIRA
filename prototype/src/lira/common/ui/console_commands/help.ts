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
 * │ Module Name     │ lira/common/ui/console_commands/help
 * │ Filename        │ help.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `help` command: lists every registered command, with a
 * │                 │ pointer to --help and wildcard use.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/help
 * @file help.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";

/** Lists every registered command by reading `context.commands` --
 * the live registry `index.ts` builds, not a hand-maintained duplicate
 * list -- so adding a new command file and registering it there is the
 * only step needed for `help` to pick it up too. */
export const helpCommand: ConsoleCommand = {
  name: "help",
  description: "list available commands",
  run: ({ commands }) => [
    "Available commands:",
    ...Object.values(commands)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((command) => `  ${command.name.padEnd(8)}${command.description}`),
    "",
    "Run 'COMMAND --help' for a command's options. Filenames may use the",
    "wildcards * ? [...], and quotes or \\ keep them literal.",
  ],
};
