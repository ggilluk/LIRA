import type { ConsoleCommand } from "./types";
import { forEachOperand } from "./shared";

export const touchCommand: ConsoleCommand = {
  name: "touch",
  description: "create an empty file (no-op if it already exists)",
  run: ({ fs, args }) => {
    if (args.length === 0) throw new Error("touch: missing operand");
    return forEachOperand(args, (path) => fs.touch(path));
  },
};
