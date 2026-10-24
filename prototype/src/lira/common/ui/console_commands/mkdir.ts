import type { ConsoleCommand } from "./types";
import { forEachOperand } from "./shared";

export const mkdirCommand: ConsoleCommand = {
  name: "mkdir",
  description: "create a directory",
  run: ({ fs, args }) => {
    if (args.length === 0) throw new Error("mkdir: missing operand");
    return forEachOperand(args, (path) => fs.makeDirectory(path));
  },
};
