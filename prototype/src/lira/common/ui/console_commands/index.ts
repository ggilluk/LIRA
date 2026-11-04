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
 * │ Module Name     │ lira/common/ui/console_commands/index
 * │ Filename        │ index.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-26
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console command registry: maps each typed command name to its
 * │                 │ ConsoleCommand implementation.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/index
 * @file index.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import { helpCommand } from "./help";
import { clearCommand } from "./clear";
import { pwdCommand } from "./pwd";
import { lsCommand } from "./ls";
import { cdCommand } from "./cd";
import { mkdirCommand } from "./mkdir";
import { touchCommand } from "./touch";
import { catCommand } from "./cat";
import { echoCommand } from "./echo";
import { rmCommand } from "./rm";
import { mvCommand } from "./mv";
import { cpCommand } from "./cp";
import { dfCommand } from "./df";
import { psCommand } from "./ps";
import { gpuCommand } from "./gpu";

export type { ConsoleCommand, ConsoleCommandContext, ConsoleServices, MetricsProvider } from "./types";

/** Every real Console command, one file each -- `console_view.ts`'s
 * own `runCommand()` looks a typed-in name up here (case-insensitively)
 * rather than through an `if`/`else if` chain the way this scaffold's
 * first version (`help`/`clear` only) did; adding a command is adding
 * one file plus one line here, nothing in `console_view.ts` itself. */
const ALL_COMMANDS: readonly ConsoleCommand[] = [
  helpCommand,
  clearCommand,
  pwdCommand,
  lsCommand,
  cdCommand,
  mkdirCommand,
  touchCommand,
  catCommand,
  echoCommand,
  rmCommand,
  mvCommand,
  cpCommand,
  dfCommand,
  psCommand,
  gpuCommand,
];

export const CONSOLE_COMMANDS: Readonly<Record<string, ConsoleCommand>> = Object.fromEntries(ALL_COMMANDS.map((command) => [command.name, command]));
