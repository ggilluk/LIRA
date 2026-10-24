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
 * own stdout always ends with one. */
export const echoCommand: ConsoleCommand = {
  name: "echo",
  description: "print text, or write/append it to a file with > / >>",
  run: ({ fs, args }) => {
    const redirectIndex = args.findIndex((arg) => arg === ">" || arg === ">>");
    if (redirectIndex === -1) return [args.join(" ")];

    const append = args[redirectIndex] === ">>";
    const path = args[redirectIndex + 1];
    if (!path) throw new Error("lira: syntax error near unexpected token `newline'");
    fs.writeFile(path, args.slice(0, redirectIndex).join(" ") + "\n", { append });
    return [];
  },
};
