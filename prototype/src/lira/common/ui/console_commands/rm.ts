import type { ConsoleCommand } from "./types";
import { forEachOperand } from "./shared";

/** `-r`/`-rf`/`-fr`/... -- any arg starting with `-` whose own
 * remaining letters include `r` turns on recursive removal, the same
 * loose single-dash-bundle matching real bash's own flag parsing does;
 * every arg starting with `-` is then excluded from the path list,
 * `-f`-only being this scaffold's one unimplemented bash flag (nothing
 * here ever refuses to remove something that exists, so there's
 * nothing for "force" to actually change). */
export const rmCommand: ConsoleCommand = {
  name: "rm",
  description: "remove files or directories (-r for directories)",
  run: ({ fs, args }) => {
    const recursive = args.some((arg) => arg.startsWith("-") && arg.includes("r"));
    const paths = args.filter((arg) => !arg.startsWith("-"));
    if (paths.length === 0) throw new Error("rm: missing operand");
    return forEachOperand(paths, (path) => fs.remove(path, { recursive }));
  },
};
