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
 * │                 │ character set, `file --mime` style.
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
import { decodeText } from "./shared";

/** `file path...` -- real `file --mime`'s own output shape, one
 * `path: type; charset=...` line per operand. A file that declares its
 * media type reports exactly that (and its declared character set);
 * one that doesn't is classified from its bytes the way `file` itself
 * would at its simplest: empty, valid UTF-8 text, or binary data. */
export const fileCommand: ConsoleCommand = {
  name: "file",
  description: "show each file's media type and character set",
  run: ({ fs, args }) => {
    if (args.length === 0) throw new Error("file: missing operand");
    return args.map((path) => {
      let stat;
      try {
        stat = fs.stat(path);
      } catch {
        return `${path}: cannot open '${path}' (No such file or directory)`;
      }
      if (stat.kind === "dir") return `${path}: inode/directory; charset=binary`;
      const content = fs.readFile(path);
      if (content.mimeCode) {
        const charset = content.characterSetCode ? content.characterSetCode.labels()[0].toLowerCase() : "binary";
        return `${path}: ${content.mimeCode.value}; charset=${charset}`;
      }
      if (content.value.byteLength === 0) return `${path}: inode/x-empty; charset=binary`;
      return "text" in decodeText(content) ? `${path}: text/plain; charset=utf-8` : `${path}: application/octet-stream; charset=binary`;
    });
  },
};
