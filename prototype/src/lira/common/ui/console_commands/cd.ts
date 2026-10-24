import type { ConsoleCommand } from "./types";

/** Bare `cd` (no args) goes to `/` -- this toy filesystem has no `$HOME`
 * concept for it to go to instead, the way a real bash `cd` alone
 * would. */
export const cdCommand: ConsoleCommand = {
  name: "cd",
  description: "change the working directory",
  run: ({ fs, args }) => {
    fs.changeDirectory(args[0] ?? "/");
    return [];
  },
};
