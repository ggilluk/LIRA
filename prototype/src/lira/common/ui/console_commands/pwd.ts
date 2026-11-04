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
 * │ Module Name     │ lira/common/ui/console_commands/pwd
 * │ Filename        │ pwd.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `pwd` command: prints the working directory (-L/-P
 * │                 │ accepted).
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/pwd
 * @file pwd.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import { commandWithOptions } from "./options";

/** `-L` and `-P` are accepted and print the same path: with no symlinks
 * in this filesystem, the logical and physical working directory are
 * always one and the same. */
export const pwdCommand: ConsoleCommand = commandWithOptions({
  name: "pwd",
  description: "print the working directory",
  usage: "[OPTION]...",
  summary: "Print the full name of the current working directory.",
  options: [
    { name: "logical", short: "L", long: "logical", description: "print the logical working directory" },
    { name: "physical", short: "P", long: "physical", description: "print the physical working directory (the same here)" },
  ],
  run: ({ fs }) => [fs.pwd()],
});
