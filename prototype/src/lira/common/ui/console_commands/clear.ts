import type { ConsoleCommand } from "./types";

/** The one command that can't just return lines to append -- clearing
 * means resetting the whole scrollback, an instance field on
 * `ConsoleView` no `ConsoleCommand.run()` return value alone can reach.
 * `clearScrollback()` (`ConsoleCommandContext`'s own docstring) is
 * exactly that escape hatch, called directly rather than expressed
 * through the return value. */
export const clearCommand: ConsoleCommand = {
  name: "clear",
  description: "clear the console",
  run: ({ clearScrollback }) => {
    clearScrollback();
    return [];
  },
};
