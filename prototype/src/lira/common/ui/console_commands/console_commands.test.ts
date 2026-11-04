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
 * │ Module Name     │ lira/common/ui/console_commands/console_commands.test
 * │ Filename        │ console_commands.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-11-02
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for every Console command, run against a real
 * │                 │ VirtualFileSystem and fake Services, including each command's
 * │                 │ Unix switches and metadata-aware cat, ls -l, stat and file.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/console_commands.test
 * @file console_commands.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { afterEach, describe, expect, it } from "vitest";
import { type BinaryObject, binaryObject, CharacterSetCode, CharacterSetCodelist, EncodingCode, EncodingCodelist, MimeCode, MimeCodelist } from "../../../value_objects";
import { VirtualFileSystem } from "../../data/virtual_file_system";
import { ServiceStatusBoard } from "../../data/service_status";
import { CONSOLE_COMMANDS } from "./index";
import type { ConsoleCommand, ConsoleCommandContext, ConsoleServices, MetricsProvider } from "./types";

/** UTF-8 `text`, as the `BinaryObject` every VirtualFileSystem file
 * holds -- most of these tests exercise tree behaviour, not bytes, so
 * text is just the convenient thing to write. */
function textFile(text: string): BinaryObject {
  return binaryObject(new TextEncoder().encode(text));
}

function readText(fs: VirtualFileSystem, path: string): string {
  return new TextDecoder().decode(fs.readFile(path).value);
}

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
    expect(readText(fs, "/a.txt")).toBe("hi there\n");
  });

  it("echo with '>>' appends rather than overwriting", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.echo, context(["one", ">", "/a.txt"], fs));
    await run(CONSOLE_COMMANDS.echo, context(["two", ">>", "/a.txt"], fs));
    expect(readText(fs, "/a.txt")).toBe("one\ntwo\n");
  });

  it("cat prints a written file's own content back", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.echo, context(["content", ">", "/a.txt"], fs));
    expect(await run(CONSOLE_COMMANDS.cat, context(["/a.txt"], fs))).toEqual(["content\n"]);
  });

  it("cat across multiple operands keeps going, interleaving a failed operand's own error with successful content", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("A"));
    fs.writeFile("/c.txt", textFile("C"));
    const output = await run(CONSOLE_COMMANDS.cat, context(["/a.txt", "/b.txt", "/c.txt"], fs));
    expect(output).toEqual(["A", "cat: /b.txt: No such file or directory", "C"]);
  });
});

describe("cat / ls -l / stat / file read each file's own metadata", () => {
  const latin1 = new CharacterSetCode(CharacterSetCodelist.ISO_8859_1_1987);

  it("cat decodes a file in its own declared character set", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/latin1.txt", binaryObject(new Uint8Array([0x63, 0x61, 0x66, 0xe9]), { characterSetCode: latin1 }));
    expect(await run(CONSOLE_COMMANDS.cat, context(["/latin1.txt"], fs))).toEqual(["café"]);
  });

  it("cat falls back to a file's encodingCode when it declares no character set", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/u16.txt", binaryObject(new Uint8Array([0x68, 0, 0x69, 0]), { encodingCode: new EncodingCode(EncodingCodelist.UTF_16) }));
    fs.writeFile("/ebcdic", binaryObject(new Uint8Array([0xc1]), { encodingCode: new EncodingCode(EncodingCodelist.CODE_PAGE_500_EBCDIC_MULTINATIONAL_NO_5) }));
    expect(await run(CONSOLE_COMMANDS.cat, context(["/u16.txt", "/ebcdic"], fs))).toEqual([
      "hi",
      "cat: /ebcdic: unsupported encoding 'Code page 500 (EBCDIC Multinational No. 5)', not shown",
    ]);
  });

  it("cat shows a notice, not garbage, for a non-text media type or bytes that aren't valid text", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.png", binaryObject(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { mimeCode: new MimeCode(MimeCodelist.IMAGE_PNG) }));
    fs.writeFile("/raw", binaryObject(new Uint8Array([0xff, 0xfe, 0x00])));
    expect(await run(CONSOLE_COMMANDS.cat, context(["/a.png", "/raw"], fs))).toEqual([
      "cat: /a.png: binary file (image/png), not shown",
      "cat: /raw: binary file, not shown",
    ]);
  });

  it("ls -l lists each entry's type, size and media type", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.echo, context(["hi", ">", "/a.txt"], fs));
    fs.makeDirectory("/d");
    fs.writeFile("/d/x", textFile("12345"));
    expect(await run(CONSOLE_COMMANDS.ls, context(["-l", "/"], fs))).toEqual([
      "-        3  text/plain               a.txt",
      "d        5  -                        d/",
    ]);
    expect(await run(CONSOLE_COMMANDS.ls, context(["-l", "/a.txt"], fs))).toEqual(["-        3  text/plain               /a.txt"]);
  });

  it("stat reports size, kind, media type and character set", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.echo, context(["hi", ">", "/a.txt"], fs));
    fs.writeFile("/b.wav", binaryObject(new Uint8Array(4), { mimeCode: new MimeCode("audio/wav") }));
    expect(await run(CONSOLE_COMMANDS.stat, context(["/a.txt", "/b.wav", "/nope"], fs))).toEqual([
      "  File: /a.txt",
      "  Size: 3\tregular file",
      "  Type: text/plain",
      "Charset: UTF-8 (IANA 106)",
      "Encoding: UTF-8 (UNCL 0133 7)",
      "  File: /b.wav",
      "  Size: 4\tregular file",
      "  Type: audio/wav (not IANA-registered)",
      "stat: cannot stat '/nope': No such file or directory",
    ]);
  });

  it("file reports declared types, and classifies undeclared files from their bytes", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.echo, context(["hi", ">", "/a.txt"], fs));
    fs.touch("/empty");
    fs.writeFile("/plain", textFile("text"));
    fs.writeFile("/raw", binaryObject(new Uint8Array([0xff, 0x00])));
    fs.makeDirectory("/d");
    expect(await run(CONSOLE_COMMANDS.file, context(["/a.txt", "/empty", "/plain", "/raw", "/d", "/nope"], fs))).toEqual([
      "/a.txt: text/plain; charset=utf-8",
      "/empty: inode/x-empty; charset=binary",
      "/plain: text/plain; charset=utf-8",
      "/raw: application/octet-stream; charset=binary",
      "/d: inode/directory; charset=binary",
      "/nope: cannot open '/nope' (No such file or directory)",
    ]);
  });
});

describe("Unix switches", () => {
  async function setup(): Promise<VirtualFileSystem> {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/d");
    fs.writeFile("/d/a.txt", textFile("one\n\ntwo\n"));
    fs.writeFile("/d/.hidden", textFile("h"));
    fs.makeDirectory("/d/sub");
    fs.writeFile("/d/sub/b.txt", textFile("b"));
    return fs;
  }

  it("every option-taking command answers --help with a usage line and its options", async () => {
    const help = await run(CONSOLE_COMMANDS.rm, context(["--help"]));
    expect(help[0]).toBe("Usage: rm [OPTION]... [FILE]...");
    expect(help).toContain("  -r, --recursive  remove directories and their contents recursively");
    expect(help[help.length - 1]).toMatch(/^\s+--help\s+display this help and exit$/);
  });

  it("an unknown option gets GNU's own two-line error", async () => {
    await expect(run(CONSOLE_COMMANDS.ls, context(["-z"]))).rejects.toThrow("ls: invalid option -- 'z'\nTry 'ls --help' for more information.");
    await expect(run(CONSOLE_COMMANDS.ls, context(["--zebra"]))).rejects.toThrow("ls: unrecognized option '--zebra'");
  });

  it("-- ends options, so a name starting with - is an operand", async () => {
    const fs = new VirtualFileSystem();
    fs.touch("/-x");
    await run(CONSOLE_COMMANDS.rm, context(["--", "/-x"], fs));
    expect(fs.list("/")).toEqual([]);
  });

  it("ls: hidden files need -a (with . and ..) or -A; -1 is one per line; options may follow operands", async () => {
    const fs = await setup();
    expect(await run(CONSOLE_COMMANDS.ls, context(["/d"], fs))).toEqual(["a.txt  sub/"]);
    expect(await run(CONSOLE_COMMANDS.ls, context(["/d", "-A"], fs))).toEqual([".hidden  a.txt  sub/"]);
    expect(await run(CONSOLE_COMMANDS.ls, context(["-a1", "/d"], fs))).toEqual(["./", "../", ".hidden", "a.txt", "sub/"]);
  });

  it("ls: several operands list files first, then each directory under a header; -R recurses; -d lists a directory itself", async () => {
    const fs = await setup();
    expect(await run(CONSOLE_COMMANDS.ls, context(["/d/sub", "/d/a.txt"], fs))).toEqual(["/d/a.txt", "", "/d/sub:", "b.txt"]);
    expect(await run(CONSOLE_COMMANDS.ls, context(["-R", "/d"], fs))).toEqual(["/d:", "a.txt  sub/", "", "/d/sub:", "b.txt"]);
    expect(await run(CONSOLE_COMMANDS.ls, context(["-d", "/d"], fs))).toEqual(["/d/"]);
    expect(await run(CONSOLE_COMMANDS.ls, context(["/nope", "/d/sub"], fs))).toEqual(["ls: cannot access '/nope': No such file or directory", "/d/sub:", "b.txt"]);
  });

  it("ls -lh prints human-readable sizes", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/big", binaryObject(new Uint8Array(2048)));
    expect(await run(CONSOLE_COMMANDS.ls, context(["-lh", "/big"], fs))).toEqual(["-     2.0K  -                        /big"]);
  });

  it("cat -n numbers every line across files, -b only non-blank ones, -E marks line ends", async () => {
    const fs = await setup();
    expect(await run(CONSOLE_COMMANDS.cat, context(["-n", "/d/a.txt", "/d/sub/b.txt"], fs))).toEqual(["     1\tone", "     2\t", "     3\ttwo", "     4\tb"]);
    expect(await run(CONSOLE_COMMANDS.cat, context(["-b", "/d/a.txt"], fs))).toEqual(["     1\tone", "", "     2\ttwo"]);
    expect(await run(CONSOLE_COMMANDS.cat, context(["-E", "/d/a.txt"], fs))).toEqual(["one$", "$", "two$"]);
  });

  it("echo: -n drops the trailing newline, -e interprets escapes, and other dash words are text", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.echo, context(["-n", "hi", ">", "/a"], fs));
    expect(readText(fs, "/a")).toBe("hi");
    expect(await run(CONSOLE_COMMANDS.echo, context(["-e", "a\\tb\\nc"]))).toEqual(["a\tb\nc"]);
    expect(await run(CONSOLE_COMMANDS.echo, context(["-x", "--help"]))).toEqual(["-x --help"]);
  });

  it("rm: -f ignores missing files, -d removes only empty directories, -rv reports contents before the directory", async () => {
    const fs = await setup();
    expect(await run(CONSOLE_COMMANDS.rm, context(["-f", "/nope"], fs))).toEqual([]);
    expect(await run(CONSOLE_COMMANDS.rm, context(["-f"], fs))).toEqual([]);
    expect(await run(CONSOLE_COMMANDS.rm, context(["-d", "/d"], fs))).toEqual(["rm: cannot remove '/d': Directory not empty"]);
    fs.makeDirectory("/empty");
    expect(await run(CONSOLE_COMMANDS.rm, context(["-dv", "/empty"], fs))).toEqual(["removed directory '/empty'"]);
    expect(await run(CONSOLE_COMMANDS.rm, context(["-rv", "/d/sub"], fs))).toEqual(["removed '/d/sub/b.txt'", "removed directory '/d/sub'"]);
  });

  it("mkdir -p creates missing parents and accepts existing ones; -v reports each", async () => {
    const fs = new VirtualFileSystem();
    expect(await run(CONSOLE_COMMANDS.mkdir, context(["-pv", "/a/b/c"], fs))).toEqual([
      "mkdir: created directory '/a'",
      "mkdir: created directory '/a/b'",
      "mkdir: created directory '/a/b/c'",
    ]);
    expect(await run(CONSOLE_COMMANDS.mkdir, context(["-p", "/a/b"], fs))).toEqual([]);
    fs.touch("/f");
    expect(await run(CONSOLE_COMMANDS.mkdir, context(["-p", "/f/x"], fs))).toEqual(["mkdir: cannot create directory '/f/x': Not a directory"]);
  });

  it("touch -c never creates files", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.touch, context(["-c", "/a"], fs));
    expect(fs.list("/")).toEqual([]);
  });

  it("cp/mv take several sources into a directory, refuse a non-directory target, and honour -n and -v", async () => {
    const fs = await setup();
    fs.makeDirectory("/out");
    expect(await run(CONSOLE_COMMANDS.cp, context(["-v", "/d/a.txt", "/d/sub/b.txt", "/out"], fs))).toEqual(["'/d/a.txt' -> '/out/a.txt'", "'/d/sub/b.txt' -> '/out/b.txt'"]);
    await expect(run(CONSOLE_COMMANDS.cp, context(["/d/a.txt", "/d/sub/b.txt", "/d/a.txt"], fs))).rejects.toThrow("cp: target '/d/a.txt' is not a directory");
    fs.writeFile("/out/a.txt", textFile("keep"));
    await run(CONSOLE_COMMANDS.cp, context(["-n", "/d/a.txt", "/out"], fs));
    expect(readText(fs, "/out/a.txt")).toBe("keep");
    expect(await run(CONSOLE_COMMANDS.mv, context(["-v", "/out/b.txt", "/out/c.txt"], fs))).toEqual(["renamed '/out/b.txt' -> '/out/c.txt'"]);
    await expect(run(CONSOLE_COMMANDS.mv, context(["/out/c.txt"], fs))).rejects.toThrow("mv: missing destination file operand after '/out/c.txt'");
  });

  it("file -b leaves off the name, --mime-type the charset", async () => {
    const fs = new VirtualFileSystem();
    await run(CONSOLE_COMMANDS.echo, context(["hi", ">", "/a.txt"], fs));
    expect(await run(CONSOLE_COMMANDS.file, context(["-b", "--mime-type", "/a.txt"], fs))).toEqual(["text/plain"]);
  });

  it("cd refuses more than one operand", async () => {
    await expect(run(CONSOLE_COMMANDS.cd, context(["/", "/"]))).rejects.toThrow("cd: too many arguments");
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
    fs.writeFile("/a.txt", textFile("content"));
    await run(CONSOLE_COMMANDS.mv, context(["/a.txt", "/b.txt"], fs));
    expect(readText(fs, "/b.txt")).toBe("content");
  });

  it("cp duplicates, leaving the original intact", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("content"));
    await run(CONSOLE_COMMANDS.cp, context(["/a.txt", "/b.txt"], fs));
    expect(readText(fs, "/a.txt")).toBe("content");
    expect(readText(fs, "/b.txt")).toBe("content");
  });

  it("cp of a directory without -r reports it, naming the real flag", async () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/dir");
    expect(await run(CONSOLE_COMMANDS.cp, context(["/dir", "/dest"], fs))).toEqual(["cp: -r not specified; omitting directory '/dir'"]);
  });
});

describe("df", () => {
  it("reports the 20MB default capacity in 1K blocks, and human-readable with -h", async () => {
    expect(await run(CONSOLE_COMMANDS.df, context([]))).toEqual([
      "Filesystem     1K-blocks    Used Available Use%",
      "blobfs             20480       0     20480   0%",
    ]);
    const human = await run(CONSOLE_COMMANDS.df, context(["-h"]));
    expect(human[1]).toContain("20.0M");
    expect(human[1]).toContain("0%");
  });

  it("reflects real usage once a file is written", async () => {
    const fs = new VirtualFileSystem(1000);
    fs.writeFile("/a.txt", textFile("x".repeat(100)));
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

/** jsdom (this project's own test environment) implements no WebGPU
 * at all, which is exactly the real "unsupported browser" case
 * `gpu.ts` itself has to handle -- so the one thing every one of these
 * tests but the first has to do is stub `navigator.gpu` itself, not
 * mock the module. `delete` after each test rather than reassigning
 * `undefined` so "unsupported" tests downstream see the same real
 * absence jsdom started with. */
function stubGpu(gpu: unknown): void {
  (navigator as unknown as { gpu: unknown }).gpu = gpu;
}

function fakeAdapter(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    isFallbackAdapter: false,
    features: new Set(["depth-clip-control", "texture-compression-bc"]),
    limits: {
      maxTextureDimension1D: 8192,
      maxTextureDimension2D: 8192,
      maxTextureDimension3D: 2048,
      maxTextureArrayLayers: 2048,
      maxBindGroups: 4,
      maxBindGroupsPlusVertexBuffers: 24,
      maxBindingsPerBindGroup: 1000,
      maxDynamicUniformBuffersPerPipelineLayout: 8,
      maxDynamicStorageBuffersPerPipelineLayout: 4,
      maxSampledTexturesPerShaderStage: 16,
      maxSamplersPerShaderStage: 16,
      maxStorageBuffersPerShaderStage: 8,
      maxStorageTexturesPerShaderStage: 4,
      maxUniformBuffersPerShaderStage: 12,
      maxUniformBufferBindingSize: 65_536,
      maxStorageBufferBindingSize: 134_217_728,
      minUniformBufferOffsetAlignment: 256,
      minStorageBufferOffsetAlignment: 256,
      maxVertexBuffers: 8,
      maxBufferSize: 268_435_456,
      maxVertexAttributes: 16,
      maxVertexBufferArrayStride: 2048,
      maxInterStageShaderVariables: 16,
      maxColorAttachments: 8,
      maxColorAttachmentBytesPerSample: 32,
      maxComputeWorkgroupStorageSize: 16_384,
      maxComputeInvocationsPerWorkgroup: 256,
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupSizeY: 256,
      maxComputeWorkgroupSizeZ: 64,
      maxComputeWorkgroupsPerDimension: 65_535,
    },
    ...overrides,
  };
}

describe("gpu", () => {
  afterEach(() => {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
  });

  it("throws when WebGPU is not supported (navigator.gpu is undefined, jsdom's own real default)", async () => {
    await expect(run(CONSOLE_COMMANDS.gpu, context([]))).rejects.toThrow(/WebGPU is not supported/);
  });

  it("throws when the browser supports WebGPU but requestAdapter() finds no real adapter", async () => {
    stubGpu({ requestAdapter: async () => null, getPreferredCanvasFormat: () => "bgra8unorm" });
    await expect(run(CONSOLE_COMMANDS.gpu, context([]))).rejects.toThrow(/no GPU adapter is available/);
  });

  it("reports real adapter info, features, and every known limit", async () => {
    stubGpu({
      requestAdapter: async () =>
        fakeAdapter({ info: { vendor: "nvidia", architecture: "ada", device: "0x2684", description: "" } }),
      getPreferredCanvasFormat: () => "bgra8unorm",
    });
    const output = await run(CONSOLE_COMMANDS.gpu, context([]));
    expect(output.some((line) => line.includes("vendor") && line.includes("nvidia"))).toBe(true);
    expect(output.some((line) => line.includes("architecture") && line.includes("ada"))).toBe(true);
    expect(output.some((line) => line.includes("fallback adapter") && line.includes("false"))).toBe(true);
    expect(output.some((line) => line.includes("preferred canvas fmt") && line.includes("bgra8unorm"))).toBe(true);
    expect(output.some((line) => line.includes("depth-clip-control"))).toBe(true);
    expect(output.some((line) => line.includes("maxBufferSize") && line.includes("268,435,456"))).toBe(true);
  });

  it("shows '-' for a privacy-withheld blank info field rather than an empty cell", async () => {
    stubGpu({
      requestAdapter: async () => fakeAdapter({ info: { vendor: "", architecture: "", device: "", description: "" } }),
      getPreferredCanvasFormat: () => "bgra8unorm",
    });
    const output = await run(CONSOLE_COMMANDS.gpu, context([]));
    const vendorLine = output.find((line) => line.includes("vendor"))!;
    expect(vendorLine).toMatch(/-\s*$/);
  });

  it("falls back to the deprecated requestAdapterInfo() when adapter.info itself is absent", async () => {
    stubGpu({
      requestAdapter: async () =>
        fakeAdapter({ requestAdapterInfo: async () => ({ vendor: "intel", architecture: "gen12", device: "", description: "" }) }),
      getPreferredCanvasFormat: () => "bgra8unorm",
    });
    const output = await run(CONSOLE_COMMANDS.gpu, context([]));
    expect(output.some((line) => line.includes("vendor") && line.includes("intel"))).toBe(true);
  });

  it("shows '-' for every info field when neither info nor requestAdapterInfo() exists at all", async () => {
    stubGpu({ requestAdapter: async () => fakeAdapter(), getPreferredCanvasFormat: () => "bgra8unorm" });
    const output = await run(CONSOLE_COMMANDS.gpu, context([]));
    expect(output.find((line) => line.includes("vendor"))).toMatch(/-\s*$/);
    expect(output.find((line) => line.includes("description"))).toMatch(/-\s*$/);
  });

  it("shows '(none)' when the adapter reports no features at all", async () => {
    stubGpu({
      requestAdapter: async () => fakeAdapter({ features: new Set() }),
      getPreferredCanvasFormat: () => "bgra8unorm",
    });
    const output = await run(CONSOLE_COMMANDS.gpu, context([]));
    expect(output.some((line) => line.includes("Features (0)"))).toBe(true);
    expect(output.some((line) => line.trim() === "(none)")).toBe(true);
  });
});
