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
 * │ Module Name     │ lira/common/ui/console_commands/cd
 * │ Filename        │ cd.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `cd` command: changes the working directory; bare `cd`
 * │                 │ goes to /.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/cd
 * @file cd.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import { commandWithOptions } from "./options";

/** Bare `cd` (no operand) goes to `/` -- this toy filesystem has no
 * `$HOME` for it to go to instead, the way a real bash `cd` alone
 * would. `-L`/`-P` are accepted and mean the same here, there being no
 * symlinks to resolve either way. */
export const cdCommand: ConsoleCommand = commandWithOptions({
  name: "cd",
  description: "change the working directory",
  usage: "[-L|-P] [DIR]",
  summary: "Change the current directory to DIR (default /).",
  options: [
    { name: "logical", short: "L", description: "follow symbolic links (there are none)" },
    { name: "physical", short: "P", description: "use the physical directory structure (the same here)" },
  ],
  run: ({ fs, operands }) => {
    if (operands.length > 1) throw new Error("cd: too many arguments");
    fs.changeDirectory(operands[0] ?? "/");
    return [];
  },
});
