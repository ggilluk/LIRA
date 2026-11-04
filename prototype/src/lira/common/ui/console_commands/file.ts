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
 * │ Module Name     │ lira/common/ui/console_commands/file
 * │ Filename        │ file.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `file` command: reports each file's media type and
 * │                 │ character set, `file --mime` style, with -b and --mime-type.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/file
 * @file file.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import { commandWithOptions } from "./options";
import { decodeText } from "./shared";

/** `file path...` -- real `file --mime`'s own output shape, one
 * `path: type; charset=...` line per operand. A file that declares its
 * media type reports exactly that (and its declared character set);
 * one that doesn't is classified from its bytes the way `file` itself
 * would at its simplest: empty, valid UTF-8 text, or binary data. `-b`
 * leaves the `path: ` prefix off; `--mime-type` prints the type
 * without its charset. */
export const fileCommand: ConsoleCommand = commandWithOptions({
  name: "file",
  description: "show each file's media type and character set",
  usage: "[OPTION]... FILE...",
  summary: "Determine the media type of each FILE.",
  options: [
    { name: "brief", short: "b", long: "brief", description: "do not prepend filenames to output lines" },
    { name: "mimeType", long: "mime-type", description: "print the media type only, without its charset" },
  ],
  run: ({ fs, flags, operands }) => {
    if (operands.length === 0) throw new Error("file: missing operand");
    return operands.map((path) => {
      const prefix = flags.has("brief") ? "" : `${path}: `;
      const describe = (type: string, charset: string) => `${prefix}${type}${flags.has("mimeType") ? "" : `; charset=${charset}`}`;
      let stat;
      try {
        stat = fs.stat(path);
      } catch {
        return `${prefix}cannot open '${path}' (No such file or directory)`;
      }
      if (stat.kind === "dir") return describe("inode/directory", "binary");
      const content = fs.readFile(path);
      if (content.mimeCode) return describe(content.mimeCode.value, content.characterSetCode ? content.characterSetCode.labels()[0].toLowerCase() : "binary");
      if (content.value.byteLength === 0) return describe("inode/x-empty", "binary");
      return "text" in decodeText(content) ? describe("text/plain", "utf-8") : describe("application/octet-stream", "binary");
    });
  },
});
