import { describe, expect, it } from "vitest";
import { VirtualFileSystem } from "./virtual_file_system";

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
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
    expect(fs.readFile("/empty.txt")).toBe("");
  });

  it("touch on an already-existing file is a no-op, not an error, and doesn't truncate it", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "content");
    fs.touch("/a.txt");
    expect(fs.readFile("/a.txt")).toBe("content");
  });

  it("writeFile overwrites by default and append:true appends instead", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "one\n");
    fs.writeFile("/a.txt", "two\n", { append: true });
    expect(fs.readFile("/a.txt")).toBe("one\ntwo\n");
    fs.writeFile("/a.txt", "three\n");
    expect(fs.readFile("/a.txt")).toBe("three\n");
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
    fs.writeFile("/a.txt", "content");
    fs.move("/a.txt", "/b.txt");
    expect(fs.readFile("/b.txt")).toBe("content");
    expect(() => fs.readFile("/a.txt")).toThrow();
  });

  it("move into an existing directory places the source under its own basename", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "content");
    fs.makeDirectory("/dest");
    fs.move("/a.txt", "/dest");
    expect(fs.readFile("/dest/a.txt")).toBe("content");
  });

  it("move throws for a missing source", () => {
    expect(() => new VirtualFileSystem().move("/nope", "/dest")).toThrow("mv: cannot stat '/nope': No such file or directory");
  });

  it("copy duplicates a file -- the original still exists afterward", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "content");
    fs.copy("/a.txt", "/b.txt");
    expect(fs.readFile("/a.txt")).toBe("content");
    expect(fs.readFile("/b.txt")).toBe("content");
  });

  it("copy is a deep copy -- mutating the copy never mutates the original", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/src");
    fs.writeFile("/src/a.txt", "original");
    fs.copy("/src", "/dest", { recursive: true });
    fs.writeFile("/dest/a.txt", "changed");
    expect(fs.readFile("/src/a.txt")).toBe("original");
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
    fs.writeFile("/a.txt", "é");
    expect(fs.usedBytes()).toBe(2);
  });

  it("writeFile throws 'No space left on device' once a write would exceed capacity", () => {
    const fs = new VirtualFileSystem(10);
    fs.writeFile("/a.txt", "1234567890"); // exactly fills the 10-byte cap
    expect(() => fs.writeFile("/b.txt", "x")).toThrow("/b.txt: No space left on device");
  });

  it("overwriting a file with smaller content is never rejected for 'space' -- the projection accounts for what's freed", () => {
    const fs = new VirtualFileSystem(10);
    fs.writeFile("/a.txt", "1234567890");
    expect(() => fs.writeFile("/a.txt", "x")).not.toThrow();
    expect(fs.readFile("/a.txt")).toBe("x");
  });

  it("copy throws 'No space left on device' when the duplicate wouldn't fit", () => {
    const fs = new VirtualFileSystem(8);
    fs.writeFile("/a.txt", "12345"); // 5 bytes used; a second copy needs 10, over an 8-byte cap
    expect(() => fs.copy("/a.txt", "/b.txt")).toThrow("No space left on device");
  });
});

describe("VirtualFileSystem.toBlob", () => {
  it("returns a real Blob, application/json typed", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "hello");
    const blob = fs.toBlob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");
  });

  it("the Blob's own content round-trips the tree -- a written file's content is recoverable from it", async () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", "hello world");
    // Blob.prototype.text()/.arrayBuffer() aren't implemented by this
    // project's own jsdom test environment -- FileReader is the one
    // Blob-reading API it does support, so that's what reads it back
    // here, not a gap in VirtualFileSystem itself.
    const text = await readBlobAsText(fs.toBlob());
    const parsed = JSON.parse(text);
    expect(parsed.kind).toBe("dir");
    expect(parsed.children["a.txt"]).toEqual({ kind: "file", content: "hello world" });
  });
});
