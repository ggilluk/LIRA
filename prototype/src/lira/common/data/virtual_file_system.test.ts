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
 * │                 │ directories, mv/cp (including into-itself refusals and the
 * │                 │ working directory), capacity limits, owned immutable
 * │                 │ BinaryObject content, append metadata rules, and the
 * │                 │ toBlob()/fromBlob() disk image.
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
import { type BinaryObject, binaryObject, CharacterSetCode, CharacterSetCodelist, EncodingCode, EncodingCodelist, MimeCode, MimeCodelist, Uri } from "../../value_objects";
import { VirtualFileSystem } from "./virtual_file_system";

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
    expect(() => fs.readFile("/nope")).toThrow("/nope: No such file or directory");
    expect(() => fs.readFile("/dir")).toThrow("/dir: Is a directory");
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

const UTF_8 = new CharacterSetCode(CharacterSetCodelist.UTF_8);
const UTF_16LE = new CharacterSetCode(CharacterSetCodelist.UTF_16LE);
const TEXT_PLAIN = new MimeCode(MimeCodelist.TEXT_PLAIN);

describe("VirtualFileSystem: the filesystem owns its bytes", () => {
  it("round-trips arbitrary bytes exactly, including ones that aren't valid UTF-8", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.bin", binaryObject(new Uint8Array([0x00, 0x80, 0xff, 0xfe])));
    expect(Array.from(fs.readFile("/a.bin").value)).toEqual([0x00, 0x80, 0xff, 0xfe]);
    expect(fs.usedBytes()).toBe(4);
  });

  it("changing the bytes readFile returned never changes the stored file", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.bin", binaryObject(new Uint8Array([1, 2, 3])));
    fs.readFile("/a.bin").value[0] = 9;
    expect(Array.from(fs.readFile("/a.bin").value)).toEqual([1, 2, 3]);
  });

  it("the writer changing the array it passed in never changes the stored file", () => {
    const fs = new VirtualFileSystem();
    const bytes = new Uint8Array([1, 2, 3]);
    fs.writeFile("/a.bin", binaryObject(bytes));
    bytes[0] = 9;
    expect(Array.from(fs.readFile("/a.bin").value)).toEqual([1, 2, 3]);
  });

  it("readFile returns a frozen snapshot -- its fields can't be reassigned to swap content past capacity", () => {
    const fs = new VirtualFileSystem(4);
    fs.writeFile("/a.bin", binaryObject(new Uint8Array([1])));
    const snapshot = fs.readFile("/a.bin");
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(() => {
      (snapshot as { value: Uint8Array }).value = new Uint8Array(1000);
    }).toThrow(TypeError);
    expect(fs.usedBytes()).toBe(1);
  });

  it("a small view onto a large buffer is stored as just its own bytes", () => {
    const fs = new VirtualFileSystem();
    const big = new Uint8Array(1024);
    big[10] = 7;
    fs.writeFile("/a.bin", binaryObject(big.subarray(10, 11)));
    const stored = fs.readFile("/a.bin").value;
    expect(Array.from(stored)).toEqual([7]);
    expect(stored.buffer.byteLength).toBe(1);
  });

  it("a copy holds the same content as its source, and each changes independently afterwards", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.bin", binaryObject(new Uint8Array([1, 2, 3])));
    fs.copy("/a.bin", "/b.bin");
    fs.writeFile("/b.bin", binaryObject(new Uint8Array([9])));
    expect(Array.from(fs.readFile("/a.bin").value)).toEqual([1, 2, 3]);
    expect(Array.from(fs.readFile("/b.bin").value)).toEqual([9]);
  });
});

describe("VirtualFileSystem: filename is attached at read time", () => {
  it("filename names the path the file was read from, ignoring any filename the writer supplied", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", binaryObject(new Uint8Array(0), { filename: "something-else.txt" }));
    expect(fs.readFile("/a.txt").filename).toBe("a.txt");
    fs.touch("/b.txt");
    expect(fs.readFile("/b.txt").filename).toBe("b.txt");
  });

  it("a snapshot keeps the name it was read under; reading again after a move gives the new one", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("content"));
    const before = fs.readFile("/a.txt");
    fs.makeDirectory("/dest");
    fs.move("/a.txt", "/dest/b.txt");
    expect(before.filename).toBe("a.txt");
    expect(fs.readFile("/dest/b.txt").filename).toBe("b.txt");
  });

  it("copies -- including nested ones from a recursive copy -- read back under their own names", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/src");
    fs.writeFile("/src/a.txt", textFile("content"));
    fs.copy("/src", "/dest", { recursive: true });
    fs.move("/dest/a.txt", "/dest/renamed.txt");
    expect(fs.readFile("/dest/renamed.txt").filename).toBe("renamed.txt");
    expect(fs.readFile("/src/a.txt").filename).toBe("a.txt");
  });
});

describe("VirtualFileSystem: supplementary components and append", () => {
  it("keeps the written mimeCode and characterSetCode, reported by stat", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", binaryObject(new TextEncoder().encode("hi"), { mimeCode: TEXT_PLAIN, characterSetCode: UTF_8 }));
    const stat = fs.stat("/a.txt");
    expect(stat).toMatchObject({ name: "a.txt", kind: "file", size: 2 });
    expect(stat.mimeCode?.value).toBe("text/plain");
    expect(stat.characterSetCode?.value).toBe("106");
  });

  it("stat on a directory reports its total content size", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/d");
    fs.writeFile("/d/a", textFile("abc"));
    fs.writeFile("/d/b", textFile("de"));
    expect(fs.stat("/d")).toEqual({ name: "d", kind: "dir", size: 5 });
    expect(fs.stat("/")).toEqual({ name: "/", kind: "dir", size: 5 });
  });

  it("append refuses a media type that contradicts the file's own", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", binaryObject(new TextEncoder().encode("one"), { mimeCode: TEXT_PLAIN }));
    expect(() => fs.writeFile("/a.txt", binaryObject(new Uint8Array([1]), { mimeCode: new MimeCode(MimeCodelist.APPLICATION_OCTET_STREAM) }), { append: true })).toThrow(
      "/a.txt: cannot append: media type 'application/octet-stream' does not match the file's 'text/plain'",
    );
    expect(readText(fs, "/a.txt")).toBe("one");
  });

  it("append refuses a character set that contradicts the file's own", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", binaryObject(new TextEncoder().encode("one"), { characterSetCode: UTF_8 }));
    expect(() => fs.writeFile("/a.txt", binaryObject(new Uint8Array([0x41, 0]), { characterSetCode: UTF_16LE }), { append: true })).toThrow(
      "character set 'UTF-16LE' does not match the file's 'UTF-8'",
    );
  });

  it("append refuses an encoding that contradicts the file's own", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", binaryObject(new TextEncoder().encode("one"), { encodingCode: new EncodingCode(EncodingCodelist.UTF_8) }));
    expect(() => fs.writeFile("/a.txt", binaryObject(new Uint8Array([0x41, 0]), { encodingCode: new EncodingCode(EncodingCodelist.UTF_16) }), { append: true })).toThrow(
      "encoding 'UTF-16' does not match the file's 'UTF-8'",
    );
  });

  it("append keeps matching metadata, and a touched file takes its type from its first append", () => {
    const fs = new VirtualFileSystem();
    fs.touch("/a.txt");
    expect(fs.stat("/a.txt").mimeCode).toBeUndefined();
    fs.writeFile("/a.txt", binaryObject(new TextEncoder().encode("one"), { mimeCode: TEXT_PLAIN, characterSetCode: UTF_8 }), { append: true });
    fs.writeFile("/a.txt", binaryObject(new TextEncoder().encode("two"), { mimeCode: new MimeCode("TEXT/PLAIN") }), { append: true });
    expect(readText(fs, "/a.txt")).toBe("onetwo");
    expect(fs.stat("/a.txt").mimeCode?.value).toBe("text/plain");
    expect(fs.stat("/a.txt").characterSetCode?.value).toBe("106");
  });
});

describe("VirtualFileSystem: moves and copies into themselves, and the working directory", () => {
  it("mv refuses to move a directory into itself or a descendant, and leaves the tree intact", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/a");
    fs.makeDirectory("/a/b");
    expect(() => fs.move("/a", "/a/b")).toThrow("mv: cannot move '/a' to a subdirectory of itself, '/a/b'");
    expect(() => fs.move("/a", "/a")).toThrow("subdirectory of itself");
    expect(() => fs.move("/a", "/a/b/c")).toThrow("subdirectory of itself");
    expect(fs.list("/")).toEqual([{ name: "a", kind: "dir" }]);
    expect(fs.list("/a")).toEqual([{ name: "b", kind: "dir" }]);
  });

  it("mv of a file onto its own path is a no-op", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.txt", textFile("x"));
    fs.move("/a.txt", "/a.txt");
    expect(readText(fs, "/a.txt")).toBe("x");
  });

  it("cp -r refuses to copy a directory into itself", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/a");
    expect(() => fs.copy("/a", "/a/b", { recursive: true })).toThrow("cp: cannot copy a directory, '/a', into itself, '/a/b'");
    expect(fs.list("/a")).toEqual([]);
  });

  it("moving the working directory (or an ancestor) carries the working directory with it", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/a");
    fs.makeDirectory("/a/b");
    fs.changeDirectory("/a/b");
    fs.move("/a", "/z");
    expect(fs.pwd()).toBe("/z/b");
    expect(() => fs.changeDirectory(".")).not.toThrow();
  });

  it("removing the working directory (or an ancestor) moves the working directory to its parent", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/a");
    fs.makeDirectory("/a/b");
    fs.changeDirectory("/a/b");
    fs.remove("/a", { recursive: true });
    expect(fs.pwd()).toBe("/");
    expect(fs.list()).toEqual([]);
  });

  it("removing something outside the working directory leaves it alone", () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/a");
    fs.makeDirectory("/ab");
    fs.changeDirectory("/ab");
    fs.remove("/a", { recursive: true });
    expect(fs.pwd()).toBe("/ab");
  });
});

describe("VirtualFileSystem: toBlob()/fromBlob() disk image", () => {
  it("toBlob returns an octet-stream Blob that is the content plus a small header and manifest", () => {
    const fs = new VirtualFileSystem();
    fs.writeFile("/big.bin", binaryObject(new Uint8Array(100_000)));
    const blob = fs.toBlob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/octet-stream");
    expect(blob.size).toBeGreaterThan(100_000);
    expect(blob.size).toBeLessThan(100_000 + 1024);
  });

  it("round-trips the whole tree -- directories, bytes, and every supplementary component", async () => {
    const fs = new VirtualFileSystem();
    fs.makeDirectory("/docs");
    fs.makeDirectory("/docs/empty");
    fs.writeFile("/docs/a.txt", binaryObject(new TextEncoder().encode("héllo"), { mimeCode: TEXT_PLAIN, characterSetCode: UTF_8 }));
    fs.writeFile(
      "/b.bin",
      binaryObject(new Uint8Array([0, 255, 128]), { format: "raw", mimeCode: new MimeCode("audio/wav"), encodingCode: new EncodingCode(EncodingCodelist.MUTUALLY_AGREED), uri: new Uri("https://example.org/b.bin") }),
    );
    fs.touch("/c");

    const restored = await VirtualFileSystem.fromBlob(fs.toBlob());
    expect(restored.list("/")).toEqual([
      { name: "b.bin", kind: "file" },
      { name: "c", kind: "file" },
      { name: "docs", kind: "dir" },
    ]);
    expect(restored.list("/docs")).toEqual([
      { name: "a.txt", kind: "file" },
      { name: "empty", kind: "dir" },
    ]);
    expect(readText(restored, "/docs/a.txt")).toBe("héllo");
    const a = restored.readFile("/docs/a.txt");
    expect(a.mimeCode?.value).toBe("text/plain");
    expect(a.characterSetCode?.value).toBe("106");
    const b = restored.readFile("/b.bin");
    expect(Array.from(b.value)).toEqual([0, 255, 128]);
    expect(b).toMatchObject({ format: "raw", filename: "b.bin" });
    expect(b.encodingCode?.value).toBe("ZZZ");
    expect(b.mimeCode?.value).toBe("audio/wav");
    expect(b.uri?.value).toBe("https://example.org/b.bin");
    expect(restored.readFile("/c").value.byteLength).toBe(0);
    expect(restored.usedBytes()).toBe(fs.usedBytes());
  });

  it("fromBytes rejects anything that isn't an image, a truncated one, or one too big for its capacity", async () => {
    expect(() => VirtualFileSystem.fromBytes(new TextEncoder().encode("not an image"))).toThrow("not a LIRA virtual filesystem image");
    const fs = new VirtualFileSystem();
    fs.writeFile("/a.bin", binaryObject(new Uint8Array(50)));
    const bytes = await bytesOf(fs.toBlob());
    expect(() => VirtualFileSystem.fromBytes(bytes.subarray(0, bytes.byteLength - 10))).toThrow("file bytes run past the end of the image");
    expect(() => VirtualFileSystem.fromBytes(bytes, 10)).toThrow("No space left on device");
    expect(VirtualFileSystem.fromBytes(bytes).usedBytes()).toBe(50);
  });
});

/** A Blob's bytes via FileReader -- the one Blob-reading API this
 * project's own jsdom test environment implements. */
function bytesOf(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
