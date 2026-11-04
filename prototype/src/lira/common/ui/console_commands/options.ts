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
 * │ Module Name     │ lira/common/ui/console_commands/options
 * │ Filename        │ options.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ GNU-style option parsing for Console commands: bundled and long
 * │                 │ switches, --, --help text and invalid-option errors, plus the
 * │                 │ commandWithOptions() wrapper every command uses.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/options
 * @file options.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand, ConsoleCommandContext } from "./types";

/** One boolean switch a command accepts -- `short` is its single-letter
 * form (`-r`), `long` its GNU long form (`--recursive`); either may be
 * absent, and several specs may share one `name` (`-r` and `-R` both
 * meaning recursive). `description` is its own `--help` line. */
export interface OptionSpec {
  name: string;
  short?: string;
  long?: string;
  description: string;
}

/** What a command's own `run()` gets once its arguments are parsed:
 * the set of option `name`s given, and every operand in order. */
export interface ParsedArgs {
  flags: ReadonlySet<string>;
  operands: readonly string[];
}

/** Parses `args` the way GNU `getopt_long` does for boolean options:
 * - short options may be bundled (`-rf` is `-r -f`);
 * - long options are `--name` (exact names only, no abbreviations);
 * - options may come anywhere, before or after operands (GNU's own
 *   argument permutation, so `ls dir -l` works);
 * - `--` ends option parsing, so every later argument is an operand
 *   even when it starts with `-` (`rm -- -file`);
 * - a lone `-` is an operand, not an option.
 * `--help` is always accepted and returned as `help: true` rather than
 * as a flag. An unknown option throws GNU's own two-line message. */
export function parseOptions(command: string, args: readonly string[], specs: readonly OptionSpec[]): ParsedArgs & { help: boolean } {
  const flags = new Set<string>();
  const operands: string[] = [];
  let help = false;
  let optionsEnded = false;
  const tryHelp = `Try '${command} --help' for more information.`;

  for (const arg of args) {
    if (optionsEnded || arg === "-" || !arg.startsWith("-")) {
      operands.push(arg);
      continue;
    }
    if (arg === "--") {
      optionsEnded = true;
      continue;
    }
    if (arg.startsWith("--")) {
      const [name, value] = arg.slice(2).split(/=(.*)/s, 2);
      if (name === "help") {
        help = true;
        continue;
      }
      const spec = specs.find((candidate) => candidate.long === name);
      if (!spec) throw new Error(`${command}: unrecognized option '--${name}'\n${tryHelp}`);
      if (value !== undefined) throw new Error(`${command}: option '--${name}' doesn't allow an argument\n${tryHelp}`);
      flags.add(spec.name);
      continue;
    }
    for (const letter of arg.slice(1)) {
      const spec = specs.find((candidate) => candidate.short === letter);
      if (!spec) throw new Error(`${command}: invalid option -- '${letter}'\n${tryHelp}`);
      flags.add(spec.name);
    }
  }
  return { flags, operands, help };
}

/** `command --help`'s own text, GNU coreutils' layout: a usage line, a
 * one-line summary, then one aligned line per option. */
export function helpText(command: string, usage: string, summary: string, specs: readonly OptionSpec[]): string[] {
  const lines = [`Usage: ${command} ${usage}`, summary];
  const rows = specs.map((spec) => {
    const short = spec.short ? `-${spec.short}` : "  ";
    const long = spec.long ? `--${spec.long}` : "";
    return [`  ${short}${spec.short && spec.long ? ", " : "  "}${long}`, spec.description];
  });
  rows.push(["      --help", "display this help and exit"]);
  const width = Math.max(...rows.map(([left]) => left.length)) + 2;
  lines.push("");
  for (const [left, description] of rows) lines.push(`${left.padEnd(width)}${description}`);
  return lines;
}

/** A ConsoleCommand whose arguments are parsed by `parseOptions()`
 * before `run()` sees them -- the one place every command's switch
 * handling lives, so `-rf`, `--`, `--help` and the invalid-option
 * message behave identically everywhere. */
export function commandWithOptions(definition: {
  name: string;
  description: string;
  usage: string;
  summary: string;
  options: readonly OptionSpec[];
  run(context: ConsoleCommandContext & ParsedArgs): readonly string[] | Promise<readonly string[]>;
}): ConsoleCommand {
  return {
    name: definition.name,
    description: definition.description,
    run: (context) => {
      const parsed = parseOptions(definition.name, context.args, definition.options);
      if (parsed.help) return helpText(definition.name, definition.usage, definition.summary, definition.options);
      return definition.run({ ...context, flags: parsed.flags, operands: parsed.operands });
    },
  };
}
