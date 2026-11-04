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
 * │ Module Name     │ lira/common/ui/console_commands/echo
 * │ Filename        │ echo.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `echo` command: prints text, or writes/appends it to a
 * │                 │ file with > / >> as a UTF-8 text/plain BinaryObject.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/echo
 * @file echo.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { binaryObject, CharacterSetCode, CharacterSetCodelist, MimeCode, MimeCodelist } from "../../../value_objects";
import type { ConsoleCommand } from "./types";

/** `echo foo bar` just prints "foo bar"; `echo foo > path`/`echo foo >>
 * path` writes/appends it to a file instead of printing it -- real
 * bash's own redirection is a shell-level feature every command gets
 * for free, not something `echo` itself implements, but this Console
 * has no generic redirection layer of its own (ConsoleCommand's own
 * docstring on why this scaffold stays "basic commands", not a full
 * shell grammar), so `>`/`>>` are parsed here, as plain tokens among
 * `echo`'s own args, rather than built into every command. A trailing
 * newline is appended to written content the same way a real `echo`'s
 * own stdout always ends with one. Written as a UTF-8 `text/plain`
 * `BinaryObject` -- every VirtualFileSystem file is bytes, so the
 * text-to-bytes encoding happens here, at the one command that has
 * text to write. */
export const echoCommand: ConsoleCommand = {
  name: "echo",
  description: "print text, or write/append it to a file with > / >>",
  run: ({ fs, args }) => {
    const redirectIndex = args.findIndex((arg) => arg === ">" || arg === ">>");
    if (redirectIndex === -1) return [args.join(" ")];

    const append = args[redirectIndex] === ">>";
    const path = args[redirectIndex + 1];
    if (!path) throw new Error("lira: syntax error near unexpected token `newline'");
    const bytes = new TextEncoder().encode(args.slice(0, redirectIndex).join(" ") + "\n");
    fs.writeFile(path, binaryObject(bytes, { mimeCode: new MimeCode(MimeCodelist.TEXT_PLAIN), characterSetCode: new CharacterSetCode(CharacterSetCodelist.UTF_8) }), { append });
    return [];
  },
};
