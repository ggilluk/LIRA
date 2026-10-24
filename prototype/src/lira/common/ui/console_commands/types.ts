import type { ServiceStatusBoard } from "../../data/service_status";
import type { VirtualFileSystem } from "../../data/virtual_file_system";

/** The one method `ps.ts` actually needs off `VocabularyWorkerClient`/
 * `LinguisticsWorkerClient` -- a narrow structural interface, not the
 * two real (heavy, `new Worker(...)`-constructing) client classes
 * themselves, so `ConsoleServices` below -- and every test exercising
 * `ps.ts` -- never has to construct a real Worker just to satisfy the
 * type. Both real clients' own `getMetrics()` already return this
 * shape, so passing one where a `MetricsProvider` is expected needs no
 * adapter of its own. */
export interface MetricsProvider {
  getMetrics(): Promise<{ uptimeMs: number; heapUsedBytes?: number; heapLimitBytes?: number }>;
}

/** `ps.ts`'s own view of the Portal shell's real Services -- `console_view.ts`'s
 * own constructor builds exactly one of these, from the same
 * `ServiceStatusBoard`/`VocabularyWorkerClient`/`LinguisticsWorkerClient`
 * instances `PortalShell` itself already owns, not copies of its own. */
export interface ConsoleServices {
  statusBoard: ServiceStatusBoard;
  vocabularyClient: MetricsProvider;
  linguisticsClient: MetricsProvider;
}

/** What a `ConsoleCommand`'s own `run()` gets handed each time it's
 * invoked -- `console_view.ts`'s own `runCommand()` builds a fresh one
 * per submitted line, not once per command. `fs` is the one
 * `VirtualFileSystem` instance the whole Console session shares (every
 * command operates on the same filesystem, the same way every real
 * shell builtin in one terminal session shares the same process's own
 * cwd); `commands` is the full registry (`help`'s own listing reads
 * it, nothing else does); `clearScrollback` is `clear`'s own escape
 * hatch for resetting state a `ConsoleCommand.run()` return value alone
 * can't reach (console_commands/clear.ts's own docstring on why);
 * `services` is `ps.ts`'s own window onto the real running Services
 * (`ConsoleServices`'s own docstring on why it's a narrow view, not the
 * real client classes directly). */
export interface ConsoleCommandContext {
  fs: VirtualFileSystem;
  args: readonly string[];
  commands: Readonly<Record<string, ConsoleCommand>>;
  clearScrollback: () => void;
  services: ConsoleServices;
}

/** One Console command -- `name` is what a user types to run it and
 * what `index.ts` below keys the registry by (lower-case by
 * convention, matched case-insensitively by `console_view.ts`'s own
 * dispatch); `description` is `help`'s own one-line listing text.
 * `run()` returns the lines to print -- each array entry becomes its
 * own line in the scrollback, though a single entry may itself contain
 * embedded `\n`s for genuinely multi-line output (`cat`'s own file
 * content, say) since the Console's own CSS already renders those with
 * `white-space: pre-wrap`. Throwing an `Error` from `run()` is how a
 * command reports a bash-style failure -- `console_view.ts`'s own
 * `runCommand()` catches it and prints `.message` as an error line,
 * the same role a real shell printing to stderr plays; every
 * `VirtualFileSystem` method already throws fully bash-phrased
 * messages, so most commands never need to catch anything themselves
 * (the exceptions -- `cat`/`rm`/`mkdir`/`touch` -- accept more than one
 * path and want a failure on one operand to not swallow a successful
 * result on another, real bash's own "keep going" behaviour across
 * multiple operands). May return a `Promise` instead of the lines
 * directly -- `ps.ts`'s own real worker round-trip is the one command
 * that actually needs this; `console_view.ts`'s own `runCommand()`
 * wraps every call in `Promise.resolve()` regardless, so a synchronous
 * command's own result still paints in the same single repaint it
 * always did, not two. */
export interface ConsoleCommand {
  name: string;
  description: string;
  run(context: ConsoleCommandContext): readonly string[] | Promise<readonly string[]>;
}
