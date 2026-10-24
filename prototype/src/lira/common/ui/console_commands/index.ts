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

export type { ConsoleCommand, ConsoleCommandContext } from "./types";

/** Every real Console command, one file each -- `console_view.ts`'s
 * own `runCommand()` looks a typed-in name up here (case-insensitively)
 * rather than through an `if`/`else if` chain the way this scaffold's
 * first version (`help`/`clear` only) did; adding a command is adding
 * one file plus one line here, nothing in `console_view.ts` itself. */
const ALL_COMMANDS: readonly ConsoleCommand[] = [helpCommand, clearCommand, pwdCommand, lsCommand, cdCommand, mkdirCommand, touchCommand, catCommand, echoCommand, rmCommand, mvCommand, cpCommand, dfCommand];

export const CONSOLE_COMMANDS: Readonly<Record<string, ConsoleCommand>> = Object.fromEntries(ALL_COMMANDS.map((command) => [command.name, command]));
