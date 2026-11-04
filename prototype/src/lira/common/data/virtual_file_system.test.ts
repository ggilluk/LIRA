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
 * │ Module Name     │ lira/common/data/virtual_file_system.test
 * │ Filename        │ virtual_file_system.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for VirtualFileSystem: navigation, files and
 * │                 │ directories, mv/cp, capacity limits, toBlob(), BinaryObject
 * │                 │ content and by-reference filenames.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/data/virtual_file_system.test
 * @file virtual_file_system.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { describe, expect, it } from "vitest";
import { type BinaryObject, binaryObject, MimeCode, MimeCodelist } from "../../value_objects";
import { VirtualFileSystem } from "./virtual_file_system";

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

/** UTF-8 `text`, as the `BinaryObject` every VirtualFileSystem file
 * holds -- most of these tests exercise tree behaviour, not bytes, so
 * text is just the convenient thing to write. */
function textFile(text: string): BinaryObject {
  return binaryObject(new TextEncoder().encode(text));
}

function readText(fs: VirtualFileSystem, path: string): string {
  return new TextDecoder().decode(fs.readFile(path).value);
}

describe("VirtualFileSystem: path resolution and navigation", () => {
  it("starts at root, with pwd reporting '/'", () => {
    expect(new VirtualFileSystem().pwd()).toBe("/");
  });

  it("changeDirectory moves into an existing directory and pwd reflects it", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/home");
    fs.changeDirectory("/home");
    expect(fs.pwd()).toBe("/home");
  });

  it("changeDirectory resolves a relative path against the current directory", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/a");
    fs.makeDirectory("/a/b");
    fs.changeDirectory("/a");
    fs.changeDirectory("b");
    expect(fs.pwd()).toBe("/a/b");
  });

  it("changeDirectory with '..' moves up one level, and up from root stays at root", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/a");
    fs.makeDirectory("/a/b");
    fs.changeDirectory("/a/b");
    fs.changeDirectory("..");
    expect(fs.pwd()).toBe("/a");
    fs.changeDirectory("/");
    fs.changeDirectory("..");
    expect(fs.pwd()).toBe("/");
  });

  it("changeDirectory throws a bash-phrased error for a missing path", () => {
    expect(() => new VirtualFileSystem().changeDirectory("/nope")).toThrow("cd: /nope: No such file or directory");
  });

  it("changeDirectory throws for a path that names a file, not a directory", () => {
    const fs = new VirtualFileSystem();
    fs.touch("/file.txt");
    expect(() => fs.changeDirectory("/file.txt")).toThrow("cd: /file.txt: Not a directory");
  });
});

describe("VirtualFileSystem: directories and files", () => {
  it("makeDirectory creates a directory listable from its parent", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/docs");
    expect(fs.list("/")).toEqual([{ name: "docs", kind: "dir" }]);
  });

  it("makeDirectory throws for an already-existing name", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/docs");
    expect(() => fs.makeDirectory("/docs")).toThrow("mkdir: cannot create directory '/docs': File exists");
  });

  it("makeDirectory throws when the parent directory doesn't exist -- no -p support", () => {
    const fs = new VirtualFileSystem();
    expect(() => fs.makeDirectory("/a/b")).toThrow("mkdir: cannot create directory '/a/b': No such file or directory");
  });

  it("touch creates an empty file", () => {
    const fs = new VirtualFileSystem();
    fs.touch("/empty.txt");
    expect(readText(fs, "/empty.txt")).toBe("");
  });

  it("touch on an already-existing file is a no-op, not an error, and doesn't truncate it", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("content"));
    fs.touch("/a.txt");
    expect(readText(fs, "/a.txt")).toBe("content");
  });

  it("writeFile overwrites by default and append:true appends instead", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("one\n"));
    fs.writeFile("/a.txt", textFile("two\n"), { append: true });
    expect(readText(fs, "/a.txt")).toBe("one\ntwo\n");
    fs.writeFile("/a.txt", textFile("three\n"));
    expect(readText(fs, "/a.txt")).toBe("three\n");
  });

  it("readFile throws for a missing path, and for a directory", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/dir");
    expect(() => fs.readFile("/nope")).toThrow("cat: /nope: No such file or directory");
    expect(() => fs.readFile("/dir")).toThrow("cat: /dir: Is a directory");
  });

  it("list defaults to the working directory, sorted, directories and files distinguished", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/b-dir");
    fs.touch("/a-file.txt");
    expect(fs.list()).toEqual([
      { name: "a-file.txt", kind: "file" },
      { name: "b-dir", kind: "dir" },
    ]);
  });

  it("list on a file path returns that one entry, not an error -- real ls's own behaviour", () => {
    const fs = new VirtualFileSystem();
    fs.touch("/file.txt");
    expect(fs.list("/file.txt")).toEqual([{ name: "file.txt", kind: "file" }]);
  });

  it("remove deletes a file", () => {
    const fs = new VirtualFileSystem();
    fs.touch("/a.txt");
    fs.remove("/a.txt");
    expect(() => fs.readFile("/a.txt")).toThrow();
  });

  it("remove throws for a directory unless recursive is set", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/dir");
    expect(() => fs.remove("/dir")).toThrow("rm: cannot remove '/dir': Is a directory");
    fs.remove("/dir", { recursive: true });
    expect(fs.list("/")).toEqual([]);
  });

  it("remove throws for a missing path", () => {
    expect(() => new VirtualFileSystem().remove("/nope")).toThrow("rm: cannot remove '/nope': No such file or directory");
  });
});

describe("VirtualFileSystem: move and copy", () => {
  it("move renames a file in place", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("content"));
    fs.move("/a.txt", "/b.txt");
    expect(readText(fs, "/b.txt")).toBe("content");
    expect(() => fs.readFile("/a.txt")).toThrow();
  });

  it("move into an existing directory places the source under its own basename", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("content"));
    fs.makeDirectory("/dest");
    fs.move("/a.txt", "/dest");
    expect(readText(fs, "/dest/a.txt")).toBe("content");
  });

  it("move throws for a missing source", () => {
    expect(() => new VirtualFileSystem().move("/nope", "/dest")).toThrow("mv: cannot stat '/nope': No such file or directory");
  });

  it("copy duplicates a file -- the original still exists afterward", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("content"));
    fs.copy("/a.txt", "/b.txt");
    expect(readText(fs, "/a.txt")).toBe("content");
    expect(readText(fs, "/b.txt")).toBe("content");
  });

  it("copy is a deep copy -- mutating the copy never mutates the original", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/src");
    fs.writeFile("/src/a.txt", textFile("original"));
    fs.copy("/src", "/dest", { recursive: true });
    fs.writeFile("/dest/a.txt", textFile("changed"));
    expect(readText(fs, "/src/a.txt")).toBe("original");
  });

  it("copy throws for a directory without recursive, naming the real -r flag", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/dir");
    expect(() => fs.copy("/dir", "/dest")).toThrow("cp: -r not specified; omitting directory '/dir'");
  });

  it("copy throws for a missing source", () => {
    expect(() => new VirtualFileSystem().copy("/nope", "/dest")).toThrow("cp: cannot stat '/nope': No such file or directory");
  });
});

describe("VirtualFileSystem: 20MB capacity enforcement", () => {
  it("defaults to a 20MB capacity", () => {
    expect(new VirtualFileSystem().capacityBytes).toBe(20 * 1024 * 1024);
  });

  it("usedBytes reflects real UTF-8 byte length, not JS string .length", () => {
    const fs = new VirtualFileSystem();
    // "é" is one UTF-16 code unit (string.length 1) but two UTF-8 bytes.
    fs.writeFile("/a.txt", textFile("é"));
    expect(fs.usedBytes()).toBe(2);
  });

  it("writeFile throws 'No space left on device' once a write would exceed capacity", () => {
    const fs = new VirtualFileSystem(10);
    fs.writeFile("/a.txt", textFile("1234567890")); // exactly fills the 10-byte cap
    expect(() => fs.writeFile("/b.txt", textFile("x"))).toThrow("/b.txt: No space left on device");
  });

  it("overwriting a file with smaller content is never rejected for 'space' -- the projection accounts for what's freed", () => {
    const fs = new VirtualFileSystem(10);
    fs.writeFile("/a.txt", textFile("1234567890"));
    expect(() => fs.writeFile("/a.txt", textFile("x"))).not.toThrow();
    expect(readText(fs, "/a.txt")).toBe("x");
  });

  it("copy throws 'No space left on device' when the duplicate wouldn't fit", () => {
    const fs = new VirtualFileSystem(8);
    fs.writeFile("/a.txt", textFile("12345")); // 5 bytes used; a second copy needs 10, over an 8-byte cap
    expect(() => fs.copy("/a.txt", "/b.txt")).toThrow("No space left on device");
  });
});

describe("VirtualFileSystem.toBlob", () => {
  it("returns a real Blob, application/json typed", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("hello"));
    const blob = fs.toBlob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");
  });

  it("the Blob's own content round-trips the tree -- a written file's content is recoverable from it", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("hello world"));
    // Blob.prototype.text()/.arrayBuffer() aren't implemented by this
    // project's own jsdom test environment -- FileReader is the one
    // Blob-reading API it does support, so that's what reads it back
    // here, not a gap in VirtualFileSystem itself.
    const text = await readBlobAsText(fs.toBlob());
    const parsed = JSON.parse(text);
    expect(parsed.kind).toBe("dir");
    // "aGVsbG8gd29ybGQ=" is "hello world" base64-encoded -- Binary
    // Object. Content's own CCTS representation inside the JSON.
    expect(parsed.children["a.txt"]).toEqual({ kind: "file", content: { value: "aGVsbG8gd29ybGQ=", filename: "a.txt" } });
  });

  it("keeps each file's own supplementary components alongside its value", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", binaryObject(new Uint8Array([104, 105]), { mimeCode: new MimeCode(MimeCodelist.TEXT_PLAIN), characterSetCode: "UTF-8" }));
    const parsed = JSON.parse(await readBlobAsText(fs.toBlob()));
    expect(parsed.children["a.txt"].content).toEqual({ value: "aGk=", mimeCode: "text/plain", characterSetCode: "UTF-8", filename: "a.txt" });
  });
});

describe("VirtualFileSystem: BinaryObject file content", () => {
  it("round-trips arbitrary bytes exactly, including ones that aren't valid UTF-8", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.bin", binaryObject(new Uint8Array([0x00, 0x80, 0xff, 0xfe])));
    expect(Array.from(fs.readFile("/a.bin").value)).toEqual([0x00, 0x80, 0xff, 0xfe]);
    expect(fs.usedBytes()).toBe(4);
  });

  it("keeps the written supplementary components, and append keeps the existing file's own", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", binaryObject(new TextEncoder().encode("one"), { mimeCode: new MimeCode(MimeCodelist.TEXT_PLAIN) }));
    fs.writeFile("/a.txt", binaryObject(new TextEncoder().encode("two"), { mimeCode: new MimeCode(MimeCodelist.APPLICATION_OCTET_STREAM) }), { append: true });
    expect(fs.readFile("/a.txt").mimeCode?.value).toBe(MimeCodelist.TEXT_PLAIN);
    expect(readText(fs, "/a.txt")).toBe("onetwo");
  });

  it("filename names the file's own path, ignoring any filename the writer supplied", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", binaryObject(new Uint8Array(0), { filename: "something-else.txt" }));
    expect(fs.readFile("/a.txt").filename).toBe("a.txt");
    fs.touch("/b.txt");
    expect(fs.readFile("/b.txt").filename).toBe("b.txt");
  });

  it("filename is by reference -- a BinaryObject read before a move reports the new name after it", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("content"));
    const content = fs.readFile("/a.txt");
    fs.makeDirectory("/dest");
    fs.move("/a.txt", "/dest/b.txt");
    expect(content.filename).toBe("b.txt");
  });

  it("a copy's own filename reads the copy's name, and the source's still reads its own", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("content"));
    fs.copy("/a.txt", "/c.txt");
    expect(fs.readFile("/a.txt").filename).toBe("a.txt");
    expect(fs.readFile("/c.txt").filename).toBe("c.txt");
  });

  it("a recursive copy re-binds every nested file's own filename too", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/src");
    fs.writeFile("/src/a.txt", textFile("content"));
    fs.copy("/src", "/dest", { recursive: true });
    fs.move("/dest/a.txt", "/dest/renamed.txt");
    expect(fs.readFile("/dest/renamed.txt").filename).toBe("renamed.txt");
    expect(fs.readFile("/src/a.txt").filename).toBe("a.txt");
  });

  it("a copy never shares its bytes with the source -- mutating one's value leaves the other's intact", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.bin", binaryObject(new Uint8Array([1, 2, 3])));
    fs.copy("/a.bin", "/b.bin");
    fs.readFile("/b.bin").value[0] = 9;
    expect(Array.from(fs.readFile("/a.bin").value)).toEqual([1, 2, 3]);
  });
});
