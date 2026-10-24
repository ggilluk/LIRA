import { describe, expect, it } from "vitest";
import { VirtualFileSystem } from "../../data/virtual_file_system";
import { CONSOLE_COMMANDS } from "./index";
import type { ConsoleCommandContext } from "./types";

/** Builds a fresh context sharing one `VirtualFileSystem` and the real
 * `CONSOLE_COMMANDS` registry (so `help` sees every real command, the
 * same way `console_view.ts` itself wires it) -- `clearScrollback` just
 * records whether it was called, since these tests exercise commands
 * directly, with no real scrollback of their own to clear. An arrow
 * function closing over `ctx` by reference, not a `this`-bound method
 * -- `clear.ts`'s own `run()` destructures `clearScrollback` off its
 * context and calls it bare (`clearScrollback()`, not
 * `context.clearScrollback()`), which would lose a `this` binding
 * entirely. */
function context(args: readonly string[], fs = new VirtualFileSystem()): ConsoleCommandContext & { fs: VirtualFileSystem; cleared: boolean } {
  const ctx = {
    fs,
    args,
    commands: CONSOLE_COMMANDS,
    cleared: false,
    clearScrollback: () => {
      ctx.cleared = true;
    },
  };
  return ctx;
}

describe("help", () => {
  it("lists every registered command, alphabetically, each with its own description", () => {
    const output = CONSOLE_COMMANDS.help.run(context([]));
    expect(output[0]).toBe("Available commands:");
    const names = Object.keys(CONSOLE_COMMANDS).sort();
    for (const name of names) expect(output.some((line) => line.trimStart().startsWith(name))).toBe(true);
  });
});

describe("clear", () => {
  it("calls clearScrollback and returns no lines", () => {
    const ctx = context([]);
    const output = CONSOLE_COMMANDS.clear.run(ctx);
    expect(ctx.cleared).toBe(true);
    expect(output).toEqual([]);
  });
});

describe("pwd / cd", () => {
  it("pwd reports the working directory, cd changes it", () => {
    const fs = new VirtualFileSystem();
    expect(CONSOLE_COMMANDS.pwd.run(context([], fs))).toEqual(["/"]);
    fs.makeDirectory("/home");
    CONSOLE_COMMANDS.cd.run(context(["/home"], fs));
    expect(CONSOLE_COMMANDS.pwd.run(context([], fs))).toEqual(["/home"]);
  });

  it("bare cd (no args) goes to root", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/a");
    fs.changeDirectory("/a");
    CONSOLE_COMMANDS.cd.run(context([], fs));
    expect(fs.pwd()).toBe("/");
  });
});

describe("mkdir / touch / ls", () => {
  it("mkdir then ls shows the new directory with a trailing slash", () => {
    const fs = new VirtualFileSystem();
    CONSOLE_COMMANDS.mkdir.run(context(["/docs"], fs));
    expect(CONSOLE_COMMANDS.ls.run(context([], fs))).toEqual(["docs/"]);
  });

  it("touch then ls shows the new file with no trailing slash", () => {
    const fs = new VirtualFileSystem();
    CONSOLE_COMMANDS.touch.run(context(["/a.txt"], fs));
    expect(CONSOLE_COMMANDS.ls.run(context([], fs))).toEqual(["a.txt"]);
  });

  it("mkdir with no operand throws a bash-style 'missing operand' error", () => {
    expect(() => CONSOLE_COMMANDS.mkdir.run(context([]))).toThrow("mkdir: missing operand");
  });

  it("mkdir keeps going across multiple operands -- one bad path doesn't block the rest", () => {
    const fs = new VirtualFileSystem();
    const output = CONSOLE_COMMANDS.mkdir.run(context(["/a", "/no/parent", "/b"], fs));
    expect(output).toEqual(["mkdir: cannot create directory '/no/parent': No such file or directory"]);
    expect(CONSOLE_COMMANDS.ls.run(context([], fs))).toEqual(["a/  b/"]);
  });
});

describe("echo / cat", () => {
  it("echo with no redirection just echoes the joined text", () => {
    expect(CONSOLE_COMMANDS.echo.run(context(["hello", "world"]))).toEqual(["hello world"]);
  });

  it("echo with '>' writes to a file instead of printing, with a trailing newline", () => {
    const fs = new VirtualFileSystem();
    const output = CONSOLE_COMMANDS.echo.run(context(["hi", "there", ">", "/a.txt"], fs));
    expect(output).toEqual([]);
    expect(fs.readFile("/a.txt")).toBe("hi there\n");
  });

  it("echo with '>>' appends rather than overwriting", () => {
    const fs = new VirtualFileSystem();
    CONSOLE_COMMANDS.echo.run(context(["one", ">", "/a.txt"], fs));
    CONSOLE_COMMANDS.echo.run(context(["two", ">>", "/a.txt"], fs));
    expect(fs.readFile("/a.txt")).toBe("one\ntwo\n");
  });

  it("cat prints a written file's own content back", () => {
    const fs = new VirtualFileSystem();
    CONSOLE_COMMANDS.echo.run(context(["content", ">", "/a.txt"], fs));
    expect(CONSOLE_COMMANDS.cat.run(context(["/a.txt"], fs))).toEqual(["content\n"]);
  });

  it("cat across multiple operands keeps going, interleaving a failed operand's own error with successful content", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "A");
    fs.writeFile("/c.txt", "C");
    const output = CONSOLE_COMMANDS.cat.run(context(["/a.txt", "/b.txt", "/c.txt"], fs));
    expect(output).toEqual(["A", "cat: /b.txt: No such file or directory", "C"]);
  });
});

describe("rm", () => {
  it("-r (or -rf, bundled) enables recursive removal of a directory", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/dir");
    expect(CONSOLE_COMMANDS.rm.run(context(["/dir"], fs))).toEqual(["rm: cannot remove '/dir': Is a directory"]);
    CONSOLE_COMMANDS.rm.run(context(["-rf", "/dir"], fs));
    expect(CONSOLE_COMMANDS.ls.run(context([], fs))).toEqual([]);
  });

  it("removes a plain file without any flag", () => {
    const fs = new VirtualFileSystem();
    fs.touch("/a.txt");
    CONSOLE_COMMANDS.rm.run(context(["/a.txt"], fs));
    expect(CONSOLE_COMMANDS.ls.run(context([], fs))).toEqual([]);
  });
});

describe("mv / cp", () => {
  it("mv renames in place", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "content");
    CONSOLE_COMMANDS.mv.run(context(["/a.txt", "/b.txt"], fs));
    expect(fs.readFile("/b.txt")).toBe("content");
  });

  it("cp duplicates, leaving the original intact", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "content");
    CONSOLE_COMMANDS.cp.run(context(["/a.txt", "/b.txt"], fs));
    expect(fs.readFile("/a.txt")).toBe("content");
    expect(fs.readFile("/b.txt")).toBe("content");
  });

  it("cp of a directory without -r throws, naming the real flag", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/dir");
    expect(() => CONSOLE_COMMANDS.cp.run(context(["/dir", "/dest"], fs))).toThrow("-r not specified");
  });
});

describe("df", () => {
  it("reports the 20MB default capacity and 0% used on a fresh filesystem", () => {
    const output = CONSOLE_COMMANDS.df.run(context([]));
    expect(output[1]).toContain("20.0M");
    expect(output[1]).toContain("0%");
  });

  it("reflects real usage once a file is written", () => {
    const fs = new VirtualFileSystem(1000);
    fs.writeFile("/a.txt", "x".repeat(100));
    const output = CONSOLE_COMMANDS.df.run(context([], fs));
    expect(output[1]).toContain("10%");
  });
});
