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
 * │ Module Name     │ lira/common/ui/console_commands/shell.test
 * │ Filename        │ shell.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for the Console shell layer (word splitting,
 * │                 │ quoting, wildcard expansion) and the option parser.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/shell.test
 * @file shell.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { describe, expect, it } from "vitest";
import { binaryObject } from "../../../value_objects";
import { VirtualFileSystem } from "../../data/virtual_file_system";
import { expandGlob, parseCommandLine, splitWords } from "./shell";
import { parseOptions } from "./options";

function tree(): VirtualFileSystem {
  const fs = new VirtualFileSystem();
  for (const dir of ["/docs", "/docs/old", "/src"]) fs.makeDirectory(dir);
  for (const file of ["/docs/a.txt", "/docs/b.txt", "/docs/c.md", "/docs/.secret", "/docs/old/x.txt", "/src/main.ts", "/a*b"]) fs.writeFile(file, binaryObject(new Uint8Array(0)));
  return fs;
}

describe("splitWords", () => {
  it("splits on whitespace and joins quoted and unquoted pieces into one word", () => {
    expect(splitWords(`echo  "hello world" 'it''s' a"b"c`).map((word) => word.text)).toEqual(["echo", "hello world", "its", "abc"]);
  });

  it("keeps everything inside single quotes literal, and only \\\" and \\\\ escaped inside double quotes", () => {
    expect(splitWords(`'a\\b' "c\\"d\\\\e\\f"`).map((word) => word.text)).toEqual(["a\\b", 'c"d\\e\\f']);
  });

  it("marks only unquoted, unescaped wildcards as globs", () => {
    const [plain, quoted, escaped, mixed] = splitWords(`*.txt "*.txt" \\*.txt "a"*`);
    expect([plain.isGlob, quoted.isGlob, escaped.isGlob, mixed.isGlob]).toEqual([true, false, false, true]);
    expect(quoted.pattern).toBe("\\*.txt");
  });

  it("refuses an unclosed quote with bash's own message", () => {
    expect(() => splitWords(`echo "oops`)).toThrow("lira: unexpected EOF while looking for matching `\"'");
  });
});

describe("expandGlob", () => {
  it("matches * and ? within one directory, sorted, as relative or absolute paths", () => {
    const fs = tree();
    expect(expandGlob(fs, "/docs/*.txt")).toEqual(["/docs/a.txt", "/docs/b.txt"]);
    expect(expandGlob(fs, "/docs/?.md")).toEqual(["/docs/c.md"]);
    fs.changeDirectory("/docs");
    expect(expandGlob(fs, "*.txt")).toEqual(["a.txt", "b.txt"]);
  });

  it("matches character classes, ranges and negated classes", () => {
    const fs = tree();
    expect(expandGlob(fs, "/docs/[ab].txt")).toEqual(["/docs/a.txt", "/docs/b.txt"]);
    expect(expandGlob(fs, "/docs/[a-b].*")).toEqual(["/docs/a.txt", "/docs/b.txt"]);
    expect(expandGlob(fs, "/docs/[!a].txt")).toEqual(["/docs/b.txt"]);
    expect(expandGlob(fs, "/docs/[^ab]*")).toEqual(["/docs/c.md", "/docs/old"]);
  });

  it("skips hidden names unless the pattern itself starts with .", () => {
    const fs = tree();
    expect(expandGlob(fs, "/docs/*")).not.toContain("/docs/.secret");
    expect(expandGlob(fs, "/docs/.*")).toEqual(["/docs/.secret"]);
  });

  it("expands wildcards in any segment, and a trailing / matches directories only", () => {
    const fs = tree();
    expect(expandGlob(fs, "/*/*.txt")).toEqual(["/docs/a.txt", "/docs/b.txt"]);
    expect(expandGlob(fs, "/docs/*/x.txt")).toEqual(["/docs/old/x.txt"]);
    expect(expandGlob(fs, "/*/")).toEqual(["/docs/", "/src/"]);
  });

  it("matches nothing for a pattern with no matches", () => {
    expect(expandGlob(tree(), "/docs/*.pdf")).toEqual([]);
  });
});

describe("parseCommandLine", () => {
  it("replaces each glob with its matches, leaving quoted and escaped wildcards literal", () => {
    const fs = tree();
    expect(parseCommandLine("rm /docs/*.txt", fs)).toEqual(["rm", "/docs/a.txt", "/docs/b.txt"]);
    expect(parseCommandLine(`ls "/a*b" /a\\*b`, fs)).toEqual(["ls", "/a*b", "/a*b"]);
  });

  it("passes a glob with no matches through as typed, bash's default", () => {
    expect(parseCommandLine("ls /docs/*.pdf", tree())).toEqual(["ls", "/docs/*.pdf"]);
  });

  it("refuses a redirect target glob that matches more than one file", () => {
    expect(() => parseCommandLine("echo hi > /docs/*.txt", tree())).toThrow("lira: /docs/*.txt: ambiguous redirect");
    expect(parseCommandLine("echo hi > /docs/a*", tree())).toEqual(["echo", "hi", ">", "/docs/a.txt"]);
  });
});

describe("parseOptions", () => {
  const specs = [
    { name: "recursive", short: "r", long: "recursive", description: "" },
    { name: "recursive", short: "R", description: "" },
    { name: "force", short: "f", long: "force", description: "" },
  ];

  it("accepts bundled short options, long options, and options after operands", () => {
    const parsed = parseOptions("rm", ["a", "-Rf", "b", "--force"], specs);
    expect([...parsed.flags].sort()).toEqual(["force", "recursive"]);
    expect(parsed.operands).toEqual(["a", "b"]);
  });

  it("treats everything after -- and a lone - as operands", () => {
    expect(parseOptions("rm", ["-", "--", "-r", "--force"], specs).operands).toEqual(["-", "-r", "--force"]);
  });

  it("reports --help, and refuses an argument to a boolean long option", () => {
    expect(parseOptions("rm", ["--help"], specs).help).toBe(true);
    expect(() => parseOptions("rm", ["--force=yes"], specs)).toThrow("rm: option '--force' doesn't allow an argument");
  });
});
