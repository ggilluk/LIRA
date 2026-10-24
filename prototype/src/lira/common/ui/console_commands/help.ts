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
  ],
};
