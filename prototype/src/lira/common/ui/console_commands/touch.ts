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
 * │ Module Name     │ lira/common/ui/console_commands/touch
 * │ Filename        │ touch.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `touch` command: creates empty files, with -c.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/touch
 * @file touch.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import { commandWithOptions } from "./options";
import { forEachOperand } from "./shared";

/** `-c` touches only files that already exist -- which, with no
 * timestamps here, means it does nothing at all to anything. */
export const touchCommand: ConsoleCommand = commandWithOptions({
  name: "touch",
  description: "create empty files (no-op if they already exist)",
  usage: "[OPTION]... FILE...",
  summary: "Create each FILE that does not exist as an empty file.",
  options: [{ name: "noCreate", short: "c", long: "no-create", description: "do not create any files" }],
  run: ({ fs, flags, operands }) => {
    if (operands.length === 0) throw new Error("touch: missing file operand");
    return forEachOperand(operands, (path) => {
      if (!flags.has("noCreate")) fs.touch(path);
    });
  },
});
