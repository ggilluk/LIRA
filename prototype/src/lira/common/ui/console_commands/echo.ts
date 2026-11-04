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
 * │ Description     │ Console `echo` command: prints text or writes/appends it to a
 * │                 │ file with > / >>, with bash's -n, -e and -E.
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
import { binaryObject, CharacterSetCode, CharacterSetCodelist, EncodingCode, EncodingCodelist, MimeCode, MimeCodelist } from "../../../value_objects";
import type { ConsoleCommand } from "./types";

/** `echo foo bar` just prints "foo bar"; `echo foo > path`/`echo foo >>
 * path` writes/appends it to a file instead of printing it -- real
 * bash's own redirection is a shell-level feature every command gets
 * for free, not something `echo` itself implements, but this Console
 * has no generic redirection layer of its own, so `>`/`>>` are parsed
 * here, as plain tokens among `echo`'s own args. A trailing newline is
 * appended to written content the same way a real `echo`'s own stdout
 * always ends with one. Written as a UTF-8 `text/plain` `BinaryObject`
 * -- every VirtualFileSystem file is bytes, so the text-to-bytes
 * encoding happens here, at the one command that has text to write.
 *
 * Options follow bash's own `echo` builtin, not GNU getopt: only
 * leading words made entirely of `-n`/`-e`/`-E` letters are options
 * (anything else, `--` and `--help` included, is printed as text).
 * `-n` drops the trailing newline, `-e` interprets backslash escapes
 * (`\n`, `\t`, `\\`, ... and `\c`, which ends the output there), `-E`
 * turns that back off (the default). */
export const echoCommand: ConsoleCommand = {
  name: "echo",
  description: "print text, or write/append it to a file with > / >> (-n, -e, -E)",
  run: ({ fs, args }) => {
    let noNewline = false;
    let escapes = false;
    let start = 0;
    for (; start < args.length && /^-[neE]+$/.test(args[start]); start++) {
      for (const letter of args[start].slice(1)) {
        if (letter === "n") noNewline = true;
        else escapes = letter === "e";
      }
    }
    const rest = args.slice(start);
    const redirectIndex = rest.findIndex((arg) => arg === ">" || arg === ">>");
    const words = redirectIndex === -1 ? rest : rest.slice(0, redirectIndex);
    let text = words.join(" ");
    if (escapes) {
      const interpreted = interpretEscapes(text);
      text = interpreted.text;
      if (interpreted.stopped) noNewline = true;
    }
    if (redirectIndex === -1) return [text];

    const append = rest[redirectIndex] === ">>";
    const path = rest[redirectIndex + 1];
    if (!path) throw new Error("lira: syntax error near unexpected token `newline'");
    const bytes = new TextEncoder().encode(noNewline ? text : `${text}\n`);
    fs.writeFile(
      path,
      binaryObject(bytes, {
        mimeCode: new MimeCode(MimeCodelist.TEXT_PLAIN),
        characterSetCode: new CharacterSetCode(CharacterSetCodelist.UTF_8),
        encodingCode: new EncodingCode(EncodingCodelist.UTF_8),
      }),
      { append },
    );
    return [];
  },
};

const ESCAPES: Readonly<Record<string, string>> = { a: "\x07", b: "\b", e: "\x1b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v", "\\": "\\" };

/** `echo -e`'s own backslash escapes; `\c` stops the output there. An
 * unknown escape is left as typed, as bash leaves it. */
function interpretEscapes(text: string): { text: string; stopped: boolean } {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "\\" || i + 1 >= text.length) {
      out += text[i];
      continue;
    }
    const next = text[++i];
    if (next === "c") return { text: out, stopped: true };
    out += ESCAPES[next] ?? `\\${next}`;
  }
  return { text: out, stopped: false };
}
