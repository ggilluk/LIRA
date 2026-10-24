import type { ConsoleCommand } from "./types";

export const cpCommand: ConsoleCommand = {
  name: "cp",
  description: "copy a file or directory (-r for directories)",
  run: ({ fs, args }) => {
    const recursive = args.some((arg) => arg.startsWith("-") && arg.includes("r"));
    const paths = args.filter((arg) => !arg.startsWith("-"));
    if (paths.length !== 2) throw new Error("cp: missing destination file operand");
    fs.copy(paths[0], paths[1], { recursive });
    return [];
  },
};
