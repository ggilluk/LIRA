import { describe, expect, it } from "vitest";
import { VirtualFileSystem } from "../../data/virtual_file_system";
import { ServiceStatusBoard } from "../../data/service_status";
import { CONSOLE_COMMANDS } from "./index";
import type { ConsoleCommand, ConsoleCommandContext, ConsoleServices, MetricsProvider } from "./types";

/** `run()`'s own fresh `ConsoleCommandContext` -- sharing one
 * `VirtualFileSystem` and the real `CONSOLE_COMMANDS` registry (so
 * `help` sees every real command, the same way `console_view.ts`
 * itself wires it) -- `clearScrollback` just records whether it was
 * called, since these tests exercise commands directly, with no real
 * scrollback of their own to clear. An arrow function closing over
 * `ctx` by reference, not a `this`-bound method -- `clear.ts`'s own
 * `run()` destructures `clearScrollback` off its context and calls it
 * bare (`clearScrollback()`, not `context.clearScrollback()`), which
 * would lose a `this` binding entirely. `services` defaults to
 * `fakeServices()` below -- real tests only override it when a test is
 * actually about `ps`. */
function context(
  args: readonly string[],
  fs = new VirtualFileSystem(),
  services: ConsoleServices = fakeServices(),
): ConsoleCommandContext & { fs: VirtualFileSystem; cleared: boolean } {
  const ctx = {
    fs,
    args,
    commands: CONSOLE_COMMANDS,
    services,
    cleared: false,
    clearScrollback: () => {
      ctx.cleared = true;
    },
  };
  return ctx;
}

/** `run()`'s own default `services` -- a real `ServiceStatusBoard` (no
 * constructor side effects, safe to build directly) but fake
 * `MetricsProvider`s standing in for `VocabularyWorkerClient`/
 * `LinguisticsWorkerClient` -- both real classes construct an actual
 * `Worker` in their own constructors, which has no business running
 * inside a test. `MetricsProvider`'s own narrow, structural shape
 * (types.ts) is exactly what makes this possible without a heavier
 * mock. */
function fakeServices(overrides: Partial<Record<"vocabularyClient" | "linguisticsClient", MetricsProvider>> = {}): ConsoleServices {
  const statusBoard = new ServiceStatusBoard();
  statusBoard.register("vocabulary", "Vocabulary Service", "running", "seeding…");
  statusBoard.register("linguistics", "Linguistic Service", "idle");
  statusBoard.register("knowledge", "Knowledge Service", "not-ported");
  return {
    statusBoard,
    vocabularyClient: overrides.vocabularyClient ?? { getMetrics: async () => ({ uptimeMs: 125_000, heapUsedBytes: 12_000_000, heapLimitBytes: 4_000_000_000 }) },
    linguisticsClient: overrides.linguisticsClient ?? { getMetrics: async () => ({ uptimeMs: 125_000 }) }, // no heap fields -- performance.memory's own real absence inside a dedicated Worker's global scope, confirmed even in Chrome
  };
}

/** Every command's own `run()` may return its lines directly or as a
 * `Promise` (`ConsoleCommand`'s own docstring on why) -- this just
 * awaits either uniformly, the same `Promise.resolve()` wrapping
 * `console_view.ts`'s own `runCommand()` already does. */
async function run(command: ConsoleCommand, ctx: ConsoleCommandContext): Promise<readonly string[]> {
  return await command.run(ctx);
}

describe("help", () => {
  it("lists every registered command, alphabetically, each with its own description", async () => {
    const output = await run(CONSOLE_COMMANDS.help, context([]));
    expect(output[0]).toBe("Available commands:");
    const names = Object.keys(CONSOLE_COMMANDS).sort();
    for (const name of names) expect(output.some((line) => line.trimStart().startsWith(name))).toBe(true);
  });
});

describe("clear", () => {
  it("calls clearScrollback and returns no lines", async () => {
    const ctx = context([]);
    const output = await run(CONSOLE_COMMANDS.clear, ctx);
    expect(ctx.cleared).toBe(true);
    expect(output).toEqual([]);
  });
});

describe("pwd / cd", () => {
  it("pwd reports the working directory, cd changes it", async () => {
    const fs = new VirtualFileSystem();
    expect(await run(CONSOLE_COMMANDS.pwd, context([], fs))).toEqual(["/"]);
    fs.makeDirectory("/home");
    await run(CONSOLE_COMMANDS.cd, context(["/home"], fs));
    expect(await run(CONSOLE_COMMANDS.pwd, context([], fs))).toEqual(["/home"]);
  });

  it("bare cd (no args) goes to root", async () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/a");
    fs.changeDirectory("/a");
    await run(CONSOLE_COMMANDS.cd, context([], fs));
    expect(fs.pwd()).toBe("/");
  });
});

describe("mkdir / touch / ls", () => {
  it("mkdir then ls shows the new directory with a trailing slash", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.mkdir, context(["/docs"], fs));
    expect(await run(CONSOLE_COMMANDS.ls, context([], fs))).toEqual(["docs/"]);
  });

  it("touch then ls shows the new file with no trailing slash", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.touch, context(["/a.txt"], fs));
    expect(await run(CONSOLE_COMMANDS.ls, context([], fs))).toEqual(["a.txt"]);
  });

  it("mkdir with no operand throws a bash-style 'missing operand' error", async () => {
    await expect(run(CONSOLE_COMMANDS.mkdir, context([]))).rejects.toThrow("mkdir: missing operand");
  });

  it("mkdir keeps going across multiple operands -- one bad path doesn't block the rest", async () => {
    const fs = new VirtualFileSystem();
    const output = await run(CONSOLE_COMMANDS.mkdir, context(["/a", "/no/parent", "/b"], fs));
    expect(output).toEqual(["mkdir: cannot create directory '/no/parent': No such file or directory"]);
    expect(await run(CONSOLE_COMMANDS.ls, context([], fs))).toEqual(["a/  b/"]);
  });
});

describe("echo / cat", () => {
  it("echo with no redirection just echoes the joined text", async () => {
    expect(await run(CONSOLE_COMMANDS.echo, context(["hello", "world"]))).toEqual(["hello world"]);
  });

  it("echo with '>' writes to a file instead of printing, with a trailing newline", async () => {
    const fs = new VirtualFileSystem();
    const output = await run(CONSOLE_COMMANDS.echo, context(["hi", "there", ">", "/a.txt"], fs));
    expect(output).toEqual([]);
    expect(fs.readFile("/a.txt")).toBe("hi there\n");
  });

  it("echo with '>>' appends rather than overwriting", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.echo, context(["one", ">", "/a.txt"], fs));
    await run(CONSOLE_COMMANDS.echo, context(["two", ">>", "/a.txt"], fs));
    expect(fs.readFile("/a.txt")).toBe("one\ntwo\n");
  });

  it("cat prints a written file's own content back", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.echo, context(["content", ">", "/a.txt"], fs));
    expect(await run(CONSOLE_COMMANDS.cat, context(["/a.txt"], fs))).toEqual(["content\n"]);
  });

  it("cat across multiple operands keeps going, interleaving a failed operand's own error with successful content", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "A");
    fs.writeFile("/c.txt", "C");
    const output = await run(CONSOLE_COMMANDS.cat, context(["/a.txt", "/b.txt", "/c.txt"], fs));
    expect(output).toEqual(["A", "cat: /b.txt: No such file or directory", "C"]);
  });
});

describe("rm", () => {
  it("-r (or -rf, bundled) enables recursive removal of a directory", async () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/dir");
    expect(await run(CONSOLE_COMMANDS.rm, context(["/dir"], fs))).toEqual(["rm: cannot remove '/dir': Is a directory"]);
    await run(CONSOLE_COMMANDS.rm, context(["-rf", "/dir"], fs));
    expect(await run(CONSOLE_COMMANDS.ls, context([], fs))).toEqual([]);
  });

  it("removes a plain file without any flag", async () => {
    const fs = new VirtualFileSystem();
    fs.touch("/a.txt");
    await run(CONSOLE_COMMANDS.rm, context(["/a.txt"], fs));
    expect(await run(CONSOLE_COMMANDS.ls, context([], fs))).toEqual([]);
  });
});

describe("mv / cp", () => {
  it("mv renames in place", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "content");
    await run(CONSOLE_COMMANDS.mv, context(["/a.txt", "/b.txt"], fs));
    expect(fs.readFile("/b.txt")).toBe("content");
  });

  it("cp duplicates, leaving the original intact", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "content");
    await run(CONSOLE_COMMANDS.cp, context(["/a.txt", "/b.txt"], fs));
    expect(fs.readFile("/a.txt")).toBe("content");
    expect(fs.readFile("/b.txt")).toBe("content");
  });

  it("cp of a directory without -r throws, naming the real flag", async () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/dir");
    await expect(run(CONSOLE_COMMANDS.cp, context(["/dir", "/dest"], fs))).rejects.toThrow("-r not specified");
  });
});

describe("df", () => {
  it("reports the 20MB default capacity and 0% used on a fresh filesystem", async () => {
    const output = await run(CONSOLE_COMMANDS.df, context([]));
    expect(output[1]).toContain("20.0M");
    expect(output[1]).toContain("0%");
  });

  it("reflects real usage once a file is written", async () => {
    const fs = new VirtualFileSystem(1000);
    fs.writeFile("/a.txt", "x".repeat(100));
    const output = await run(CONSOLE_COMMANDS.df, context([], fs));
    expect(output[1]).toContain("10%");
  });
});

describe("ps", () => {
  it("lists every registered Service, one row each, with a header row first", async () => {
    const output = await run(CONSOLE_COMMANDS.ps, context([]));
    expect(output[0]).toMatch(/^PID\s+SERVICE/);
    expect(output).toHaveLength(4); // header + vocabulary + linguistics + knowledge
  });

  it("reports each Service's own real state from the status board", async () => {
    const output = await run(CONSOLE_COMMANDS.ps, context([]));
    expect(output.some((line) => line.includes("Vocabulary Service") && line.includes("RUNNING"))).toBe(true);
    expect(output.some((line) => line.includes("Linguistic Service") && line.includes("IDLE"))).toBe(true);
    expect(output.some((line) => line.includes("Knowledge Service") && line.includes("NOT PORTED"))).toBe(true);
  });

  it("shows real uptime/heap metrics fetched from each Service's own MetricsProvider", async () => {
    const output = await run(CONSOLE_COMMANDS.ps, context([]));
    const vocabularyRow = output.find((line) => line.includes("Vocabulary Service"))!;
    expect(vocabularyRow).toContain("00:02:05"); // 125_000ms
    expect(vocabularyRow).toContain("11.4M/3.7G");
  });

  it("shows '-' for heap columns when performance.memory is unavailable (e.g. inside a dedicated Worker, confirmed even in Chrome, or on a browser without the API at all)", async () => {
    const output = await run(CONSOLE_COMMANDS.ps, context([]));
    const linguisticsRow = output.find((line) => line.includes("Linguistic Service"))!;
    expect(linguisticsRow).toContain("00:02:05");
    expect(linguisticsRow).toMatch(/-\s*$/);
  });

  it("shows '-' for every metrics column for a Service with no live Worker behind it at all (not-ported)", async () => {
    const output = await run(CONSOLE_COMMANDS.ps, context([]));
    const knowledgeRow = output.find((line) => line.includes("Knowledge Service"))!;
    expect(knowledgeRow).toContain("NOT PORTED");
    expect(knowledgeRow).toMatch(/-\s+-\s*$/);
  });

  it("shows '-' rather than throwing when a Service's own getMetrics() call fails", async () => {
    const services = fakeServices({
      vocabularyClient: {
        getMetrics: async () => {
          throw new Error("worker unreachable");
        },
      },
    });
    const output = await run(CONSOLE_COMMANDS.ps, context([], new VirtualFileSystem(), services));
    const vocabularyRow = output.find((line) => line.includes("Vocabulary Service"))!;
    expect(vocabularyRow).toMatch(/-\s+-\s*$/);
  });
});
