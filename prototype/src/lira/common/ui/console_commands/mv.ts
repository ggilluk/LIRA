import type { ConsoleCommand } from "./types";

export const mvCommand: ConsoleCommand = {
  name: "mv",
  description: "move or rename a file or directory",
  run: ({ fs, args }) => {
    if (args.length !== 2) throw new Error("mv: missing destination file operand");
    fs.move(args[0], args[1]);
    return [];
  },
};
