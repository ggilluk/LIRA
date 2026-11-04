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
 * │ Module Name     │ lira/common/data/virtual_file_system
 * │ Filename        │ virtual_file_system.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ In-memory, Unix-shaped filesystem behind the Console's file
 * │                 │ commands. Owns its files' immutable BinaryObject content, attaches
 * │                 │ filenames at read time, refuses moves into itself, and saves to
 * │                 │ and loads from a binary disk image.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/data/virtual_file_system
 * @file virtual_file_system.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** VirtualFileSystem: an in-memory, Unix-shaped filesystem backing the
 * Console's own filesystem commands (`common/ui/console_commands/*.ts`)
 * -- a tree of directories and files rooted at `/`, capped at
 * `DEFAULT_FS_CAPACITY_BYTES` (20MB) total file content. `toBlob()`
 * writes the whole tree out as one real disk image (`fromBlob()` reads
 * one back): a small header and manifest followed by every file's raw
 * bytes, so an image is the capacity it holds plus a few hundred bytes
 * of structure, not a re-encoded copy of it. Every public method here
 * corresponds to exactly one bash utility (`changeDirectory` -> `cd`,
 * `makeDirectory` -> `mkdir`, ...) and throws that utility's own real
 * bash error phrasing directly (`"mkdir: cannot create directory 'x':
 * File exists"`, not a generic reason code a caller has to translate)
 * -- the whole point of fashioning this on bash is that typing a bad
 * command here reads like typing it in a real shell. `readFile()` is
 * the one exception: several commands read files (`cat`, `file`, ...),
 * so its errors carry no utility prefix and each caller adds its own.
 *
 * Deliberately has no concept of permissions, timestamps, symlinks, or
 * multiple users -- "basic commands" (what was asked for), not a real
 * kernel's own VFS layer. `touch` on an existing file is accordingly a
 * no-op (no mtime to bump), not an error, and a file `touch` creates
 * deliberately carries no `mimeCode`/`characterSetCode`: an empty file
 * has no content to have a type, and the first append gives it one.
 *
 * Every file's own content is a CCTS `BinaryObject`
 * (value_objects/data/binary_object.ts) -- raw bytes plus whichever
 * supplementary components (`mimeCode`, `characterSetCode`, ...) the
 * writer supplied. A file node is the entity here (its name and place
 * in the tree); its content is an immutable value, replaced whole on
 * every write. This filesystem owns its bytes outright: `writeFile()`
 * copies the caller's bytes in and `readFile()` copies them out, so no
 * caller ever holds a live handle on a stored file -- writing through
 * a returned `value`, or a writer mutating (or resizing) the array it
 * passed in, can never change a stored file or slip past `capacity`.
 * The stored content never carries a `filename` at all: the tree's own
 * key is the one place a name lives, and `readFile()` attaches it to
 * the snapshot it returns, so a file's `filename` is always exactly
 * where it was read from and can't go stale or be stored twice. */
import {
  type BinaryObject,
  CHARACTER_SET_CODELIST_VERSION,
  CHARACTER_SET_LABELS,
  CharacterSetCode,
  type CharacterSetCodelist,
  ENCODING_CODELIST_VERSION,
  EncodingCode,
  encodingCodelistFromCode,
  MIME_CODELIST_VERSION,
  MimeCode,
  Uri,
} from "../../value_objects";

export interface FsEntry {
  name: string;
  kind: "file" | "dir";
}

/** `stat()`'s own result -- `size` is a file's own byte length, or a
 * directory's total content (`du`-style, the only size a directory
 * has in a filesystem with no inodes or blocks). */
export interface FsStat {
  name: string;
  kind: "file" | "dir";
  size: number;
  mimeCode?: MimeCode;
  characterSetCode?: CharacterSetCode;
  encodingCode?: EncodingCode;
}

/** A stored file's own content: a frozen BinaryObject this filesystem
 * owns -- its `value` a private copy nothing outside ever sees, and no
 * `filename` (the tree's own key names it). */
type StoredContent = Readonly<Omit<BinaryObject, "filename">>;

interface FileNode {
  kind: "file";
  content: StoredContent;
}

interface DirectoryNode {
  kind: "dir";
  children: Map<string, FsNode>;
}

type FsNode = FileNode | DirectoryNode;

export const DEFAULT_FS_CAPACITY_BYTES = 20 * 1024 * 1024;

export class VirtualFileSystem {
  private readonly root: DirectoryNode = { kind: "dir", children: new Map() };
  private cwdPath: string[] = [];

  constructor(private readonly capacity: number = DEFAULT_FS_CAPACITY_BYTES) {}

  get capacityBytes(): number {
    return this.capacity;
  }

  /** Total bytes of file content currently stored -- every file's own
   * byte length summed, recomputed by walking the whole tree rather
   * than tracked incrementally, since this scaffold's own tree is small
   * enough (20MB of content, at most) that a full walk costs nothing a
   * console command would ever notice. */
  usedBytes(): number {
    return sizeOf(this.root);
  }

  pwd(): string {
    return "/" + this.cwdPath.join("/");
  }

  changeDirectory(path: string): void {
    const segments = this.resolveSegments(path);
    const node = this.nodeAt(segments);
    if (!node) throw new Error(`cd: ${path}: No such file or directory`);
    if (node.kind !== "dir") throw new Error(`cd: ${path}: Not a directory`);
    this.cwdPath = segments;
  }

  /** `path` undefined lists the working directory, matching bash's own
   * bare `ls`. Listing a file path (not a directory) returns that one
   * entry by itself -- `ls`'s own real behaviour, not an error. */
  list(path?: string): readonly FsEntry[] {
    const segments = path === undefined ? this.cwdPath : this.resolveSegments(path);
    const node = this.nodeAt(segments);
    if (!node) throw new Error(`ls: cannot access '${path ?? "."}': No such file or directory`);
    if (node.kind === "file") return [{ name: segments[segments.length - 1], kind: "file" }];
    return [...node.children.entries()].map(([name, child]) => ({ name, kind: child.kind })).sort((a, b) => a.name.localeCompare(b.name));
  }

  /** `stat`'s own view of one path -- its size and, for a file, the
   * type metadata its content carries. */
  stat(path: string): FsStat {
    const segments = this.resolveSegments(path);
    const node = this.nodeAt(segments);
    if (!node) throw new Error(`stat: cannot stat '${path}': No such file or directory`);
    const name = segments.length === 0 ? "/" : segments[segments.length - 1];
    if (node.kind === "dir") return { name, kind: "dir", size: sizeOf(node) };
    const { mimeCode, characterSetCode, encodingCode } = node.content;
    return {
      name,
      kind: "file",
      size: node.content.value.byteLength,
      ...(mimeCode ? { mimeCode } : {}),
      ...(characterSetCode ? { characterSetCode } : {}),
      ...(encodingCode ? { encodingCode } : {}),
    };
  }

  makeDirectory(path: string): void {
    const segments = this.resolveSegments(path);
    if (segments.length === 0) throw new Error(`mkdir: cannot create directory '${path}': File exists`);
    const parent = this.lookupParentDir(segments);
    const name = segments[segments.length - 1];
    if (!parent) throw new Error(`mkdir: cannot create directory '${path}': No such file or directory`);
    if (parent.children.has(name)) throw new Error(`mkdir: cannot create directory '${path}': File exists`);
    parent.children.set(name, { kind: "dir", children: new Map() });
  }

  /** Creates an empty file if `path` doesn't exist yet; a no-op
   * (neither an error nor a truncation) if it already does -- this
   * class's own docstring on why there's no mtime here to bump, and
   * why the new file carries no type metadata. */
  touch(path: string): void {
    const segments = this.resolveSegments(path);
    if (segments.length === 0) throw new Error(`touch: cannot touch '${path}': Is a directory`);
    const parent = this.lookupParentDir(segments);
    const name = segments[segments.length - 1];
    if (!parent) throw new Error(`touch: cannot touch '${path}': No such file or directory`);
    if (parent.children.get(name)?.kind === "dir") throw new Error(`touch: cannot touch '${path}': Is a directory`);
    if (!parent.children.has(name)) parent.children.set(name, fileNode({ value: new Uint8Array(0) }));
  }

  /** `echo`'s own `>`/`>>` redirection target -- `options.append` picks
   * between the two. Enforces `capacityBytes` against the *projected*
   * total (current usage minus whatever this write replaces, plus the
   * new content), so overwriting a large file with a small one is never
   * mistakenly rejected as "out of space". `content`'s bytes are copied
   * in (this class's own docstring), and any `filename` on it is
   * ignored -- the path names the file.
   *
   * Appending keeps the existing file's own supplementary components and
   * extends its bytes. Incoming metadata fills in any the file doesn't
   * have yet (a `touch`ed file takes its type from its first append),
   * but contradicting it is refused rather than silently ignored:
   * appending UTF-16 bytes to a UTF-8 file would leave a file whose
   * declared character set no longer describes its own bytes. */
  writeFile(path: string, content: BinaryObject, options: { append?: boolean } = {}): void {
    const segments = this.resolveSegments(path);
    if (segments.length === 0) throw new Error(`${path}: Is a directory`);
    const parent = this.lookupParentDir(segments);
    const name = segments[segments.length - 1];
    if (!parent) throw new Error(`${path}: No such file or directory`);
    const existing = parent.children.get(name);
    if (existing?.kind === "dir") throw new Error(`${path}: Is a directory`);

    let next: BinaryObject = content;
    if (options.append && existing) {
      const current = existing.content;
      const mismatch = metadataMismatch(current, content);
      if (mismatch) throw new Error(`${path}: cannot append: ${mismatch}`);
      next = {
        ...withoutUndefined(content),
        ...withoutUndefined(current),
        value: concatBytes(current.value, content.value),
      };
    }
    const previousBytes = existing ? existing.content.value.byteLength : 0;
    if (this.usedBytes() - previousBytes + next.value.byteLength > this.capacity) throw new Error(`${path}: No space left on device`);
    parent.children.set(name, fileNode(next));
  }

  /** A snapshot of the file at `path`: a frozen BinaryObject with its
   * own copy of the bytes and `filename` set to the name it was read
   * from. Changing the returned bytes changes only the snapshot. Errors
   * carry no utility prefix -- each reading command adds its own (this
   * class's own docstring). */
  readFile(path: string): BinaryObject {
    const segments = this.resolveSegments(path);
    const node = this.nodeAt(segments);
    if (!node) throw new Error(`${path}: No such file or directory`);
    if (node.kind !== "file") throw new Error(`${path}: Is a directory`);
    return Object.freeze({ ...node.content, value: node.content.value.slice(), filename: segments[segments.length - 1] });
  }

  /** Removing the directory the shell is in (or one above it) moves the
   * working directory up to the removed path's own parent, the nearest
   * directory that still exists -- rather than leaving `pwd` naming a
   * path every later command would fail to find. */
  remove(path: string, options: { recursive?: boolean } = {}): void {
    const segments = this.resolveSegments(path);
    if (segments.length === 0) throw new Error(`rm: cannot remove '${path}': Device or resource busy`);
    const parent = this.lookupParentDir(segments);
    const name = segments[segments.length - 1];
    const node = parent?.children.get(name);
    if (!parent || !node) throw new Error(`rm: cannot remove '${path}': No such file or directory`);
    if (node.kind === "dir" && !options.recursive) throw new Error(`rm: cannot remove '${path}': Is a directory`);
    parent.children.delete(name);
    if (startsWith(this.cwdPath, segments)) this.cwdPath = segments.slice(0, -1);
  }

  /** Bash's own "moving onto an existing directory places the source
   * inside it, under its own basename" rule -- `resolveDestination()`
   * below is shared with `copy()` for exactly this reason. Moving a
   * directory into itself or one of its own descendants is refused with
   * real `mv`'s own message: done anyway, it would detach the directory
   * from the tree and make it its own ancestor. Moving the directory
   * the shell is in carries the working directory along with it, the
   * way a real shell's working directory follows the directory itself,
   * not the path it was reached by. */
  move(source: string, destination: string): void {
    const sourceSegments = this.resolveSegments(source);
    const sourceParent = this.lookupParentDir(sourceSegments);
    const sourceName = sourceSegments[sourceSegments.length - 1];
    const node = sourceSegments.length > 0 ? sourceParent?.children.get(sourceName) : undefined;
    if (!sourceParent || !node) throw new Error(`mv: cannot stat '${source}': No such file or directory`);

    const target = this.resolveDestination(destination, sourceName);
    if (!target.parent) throw new Error(`mv: cannot move '${source}' to '${destination}': No such file or directory`);
    const targetSegments = [...target.parentSegments, target.name];
    if (sameSegments(targetSegments, sourceSegments)) return;
    if (node.kind === "dir" && startsWith(targetSegments, sourceSegments)) {
      throw new Error(`mv: cannot move '${source}' to a subdirectory of itself, '${destination}'`);
    }
    sourceParent.children.delete(sourceName);
    target.parent.children.set(target.name, node);
    if (startsWith(this.cwdPath, sourceSegments)) this.cwdPath = [...targetSegments, ...this.cwdPath.slice(sourceSegments.length)];
  }

  /** `options.recursive` mirrors `cp -r` -- copying a directory without
   * it is refused the same way the real utility refuses, as is copying
   * a directory into itself (real `cp`'s own message). A deep copy
   * either way (`cloneNode()` below): the source and the copy never
   * share a node, the same "two Domains never share a mutable Word"
   * discipline the Vocabulary layer's own `seedFrom()` methods follow. */
  copy(source: string, destination: string, options: { recursive?: boolean } = {}): void {
    const sourceSegments = this.resolveSegments(source);
    const node = this.nodeAt(sourceSegments);
    if (!node) throw new Error(`cp: cannot stat '${source}': No such file or directory`);
    if (node.kind === "dir" && !options.recursive) throw new Error(`cp: -r not specified; omitting directory '${source}'`);

    const sourceName = sourceSegments[sourceSegments.length - 1] ?? "";
    const target = this.resolveDestination(destination, sourceName);
    if (!target.parent) throw new Error(`cp: cannot create '${destination}': No such file or directory`);
    if (node.kind === "dir" && startsWith([...target.parentSegments, target.name], sourceSegments)) {
      throw new Error(`cp: cannot copy a directory, '${source}', into itself, '${destination}'`);
    }
    if (this.usedBytes() + sizeOf(node) > this.capacity) throw new Error(`cp: ${destination}: No space left on device`);
    target.parent.children.set(target.name, cloneNode(node));
  }

  /** The whole filesystem as one disk image -- a real `Blob`, for
   * whatever wants to persist or download the virtual disk (the same
   * `Blob`/`URL.createObjectURL` pattern `common/ui/portal_shell.ts`'s
   * own `downloadJsonFile()` uses for a seeded Domain). Layout:
   * - the 8 ASCII bytes `LIRAVFS1`;
   * - the manifest's byte length, a big-endian uint32;
   * - the manifest, UTF-8 JSON: the directory tree, each file giving its
   *   bytes' `offset`/`length` within the data section and its
   *   supplementary components as their own Code/Uri `value`s, plus the
   *   MIME and character-set code list versions those values belong to;
   * - the data section: every file's raw bytes, back to back.
   * The file bytes go in as the Blob's own parts, never re-encoded, so
   * writing an image costs no copy of the content and the image is the
   * content plus the manifest. */
  toBlob(): Blob {
    const parts: BlobPart[] = [];
    let offset = 0;
    const manifestRoot = manifestOf(this.root, (bytes) => {
      parts.push(bytes as Uint8Array<ArrayBuffer>);
      const at = offset;
      offset += bytes.byteLength;
      return at;
    });
    const manifest = new TextEncoder().encode(
      JSON.stringify({
        format: IMAGE_FORMAT,
        version: IMAGE_VERSION,
        mimeCodeListVersionId: MIME_CODELIST_VERSION,
        characterSetCodeListVersionId: CHARACTER_SET_CODELIST_VERSION,
        encodingCodeListVersionId: ENCODING_CODELIST_VERSION,
        root: manifestRoot,
      }),
    );
    const header = new Uint8Array(IMAGE_MAGIC.length + 4);
    header.set(IMAGE_MAGIC, 0);
    new DataView(header.buffer).setUint32(IMAGE_MAGIC.length, manifest.byteLength);
    return new Blob([header, manifest, ...parts], { type: "application/octet-stream" });
  }

  /** `toBlob()`'s own inverse: a fresh VirtualFileSystem holding the
   * tree `image` was written from, working directory `/`. Reads the
   * Blob's bytes, then `fromBytes()`. */
  static async fromBlob(image: Blob, capacity: number = DEFAULT_FS_CAPACITY_BYTES): Promise<VirtualFileSystem> {
    return VirtualFileSystem.fromBytes(await readBlobBytes(image), capacity);
  }

  /** `fromBlob()`'s synchronous core, over an image's raw bytes. Throws
   * for anything that isn't a well-formed image -- wrong magic, a
   * manifest or file range past the end of the data, a name no path
   * could reach (empty, `.`, `..`, containing `/`), an unknown character
   * set or encoding -- and for an image whose content wouldn't fit
 * `capacity`. */
  static fromBytes(image: Uint8Array, capacity: number = DEFAULT_FS_CAPACITY_BYTES): VirtualFileSystem {
    const invalid = (reason: string) => new Error(`not a LIRA virtual filesystem image: ${reason}`);
    const headerLength = IMAGE_MAGIC.length + 4;
    if (image.byteLength < headerLength || IMAGE_MAGIC.some((byte, i) => image[i] !== byte)) throw invalid("missing LIRAVFS1 header");
    const manifestLength = new DataView(image.buffer, image.byteOffset, image.byteLength).getUint32(IMAGE_MAGIC.length);
    if (headerLength + manifestLength > image.byteLength) throw invalid("manifest runs past the end of the image");
    let manifest: { format?: unknown; version?: unknown; root?: unknown };
    try {
      manifest = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(image.subarray(headerLength, headerLength + manifestLength)));
    } catch {
      throw invalid("manifest is not valid JSON");
    }
    if (manifest.format !== IMAGE_FORMAT || manifest.version !== IMAGE_VERSION) throw invalid("unsupported format or version");
    const data = image.subarray(headerLength + manifestLength);
    const fs = new VirtualFileSystem(capacity);
    const root = nodeFromManifest(manifest.root, data, invalid);
    if (root.kind !== "dir") throw invalid("root is not a directory");
    if (sizeOf(root) > capacity) throw new Error("No space left on device");
    fs.root.children = root.children;
    return fs;
  }

  private nodeAt(segments: readonly string[]): FsNode | undefined {
    return segments.length === 0 ? this.root : this.lookupNode(segments);
  }

  private resolveSegments(path: string): string[] {
    const base = path.startsWith("/") ? [] : [...this.cwdPath];
    for (const part of path.split("/")) {
      if (part === "" || part === ".") continue;
      if (part === "..") {
        if (base.length > 0) base.pop();
        continue;
      }
      base.push(part);
    }
    return base;
  }

  private lookupNode(segments: readonly string[]): FsNode | undefined {
    let node: FsNode = this.root;
    for (const segment of segments) {
      if (node.kind !== "dir") return undefined;
      const next = node.children.get(segment);
      if (!next) return undefined;
      node = next;
    }
    return node;
  }

  private lookupParentDir(segments: readonly string[]): DirectoryNode | undefined {
    const node = this.nodeAt(segments.slice(0, -1));
    return node?.kind === "dir" ? node : undefined;
  }

  /** `move()`/`copy()`'s own shared destination resolver -- if
   * `destination` already names a directory, the target becomes that
   * directory plus `fallbackName` (the source's own basename); otherwise
   * the target is `destination` itself, renamed/placed exactly there.
   * `parentSegments` is the target directory's own absolute path, what
   * the into-itself checks compare against. */
  private resolveDestination(destination: string, fallbackName: string): { parent: DirectoryNode | undefined; parentSegments: string[]; name: string } {
    const destSegments = this.resolveSegments(destination);
    const destNode = this.nodeAt(destSegments);
    if (destNode?.kind === "dir") return { parent: destNode, parentSegments: destSegments, name: fallbackName };
    return { parent: this.lookupParentDir(destSegments), parentSegments: destSegments.slice(0, -1), name: destSegments[destSegments.length - 1] ?? fallbackName };
  }
}

const IMAGE_MAGIC = new TextEncoder().encode("LIRAVFS1");
const IMAGE_FORMAT = "lira-virtual-file-system";
const IMAGE_VERSION = 1;

/** The one place a `FileNode` is built: `content` frozen, with its own
 * copy of the bytes and no `filename` -- this class's own docstring on
 * why the filesystem owns its bytes and never stores a name twice. */
function fileNode(content: BinaryObject): FileNode {
  const { filename: _filename, ...rest } = content;
  return { kind: "file", content: Object.freeze({ ...withoutUndefined(rest), value: content.value.slice() }) };
}

/** Why appending `incoming` to `current` would contradict `current`'s
 * own declared type, or undefined when it wouldn't -- a supplementary
 * component one side leaves unset never conflicts. */
function metadataMismatch(current: StoredContent, incoming: BinaryObject): string | undefined {
  const currentMime = current.mimeCode?.value.toLowerCase();
  const incomingMime = incoming.mimeCode?.value.toLowerCase();
  if (currentMime && incomingMime && currentMime !== incomingMime) return `media type '${incomingMime}' does not match the file's '${currentMime}'`;
  const currentCharset = current.characterSetCode;
  const incomingCharset = incoming.characterSetCode;
  if (currentCharset && incomingCharset && currentCharset.value !== incomingCharset.value) {
    return `character set '${incomingCharset.labels()[0]}' does not match the file's '${currentCharset.labels()[0]}'`;
  }
  const currentEncoding = current.encodingCode;
  const incomingEncoding = incoming.encodingCode;
  if (currentEncoding && incomingEncoding && currentEncoding.value !== incomingEncoding.value) {
    return `encoding '${incomingEncoding.name}' does not match the file's '${currentEncoding.name}'`;
  }
  return undefined;
}

/** `object` minus its own `undefined`-valued fields, so spreading it
 * never overwrites a set field with an unset one. */
function withoutUndefined<T extends object>(object: T): Partial<T> {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function startsWith(path: readonly string[], prefix: readonly string[]): boolean {
  return prefix.length <= path.length && prefix.every((segment, i) => path[i] === segment);
}

function sameSegments(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && startsWith(a, b);
}

function sizeOf(node: FsNode): number {
  if (node.kind === "file") return node.content.value.byteLength;
  let total = 0;
  for (const child of node.children.values()) total += sizeOf(child);
  return total;
}

/** A stored file's content is frozen and its bytes are never handed
 * out, so a copied file node can share them safely -- the copy is a new
 * node (its own place in the tree), not new bytes. */
function cloneNode(node: FsNode): FsNode {
  if (node.kind === "file") return { kind: "file", content: node.content };
  const children = new Map<string, FsNode>();
  for (const [name, child] of node.children) children.set(name, cloneNode(child));
  return { kind: "dir", children };
}

/** `toBlob()`'s own manifest for `node`, handing each file's bytes to
 * `place` (which appends them to the data section and returns their
 * offset). */
function manifestOf(node: FsNode, place: (bytes: Uint8Array) => number): unknown {
  if (node.kind === "file") {
    const { value, format, mimeCode, encodingCode, characterSetCode, uri } = node.content;
    return {
      kind: "file",
      offset: place(value),
      length: value.byteLength,
      ...(format !== undefined ? { format } : {}),
      ...(mimeCode ? { mimeCode: mimeCode.value } : {}),
      ...(encodingCode ? { encodingCode: encodingCode.value } : {}),
      ...(characterSetCode ? { characterSetCode: characterSetCode.value } : {}),
      ...(uri ? { uri: uri.value } : {}),
    };
  }
  const children: Record<string, unknown> = {};
  for (const [name, child] of node.children) children[name] = manifestOf(child, place);
  return { kind: "dir", children };
}

/** `fromBytes()`'s own inverse of `manifestOf()`, rebuilding Codes and
 * Uris from their stored `value`s and slicing each file's bytes out of
 * `data`. */
function nodeFromManifest(entry: unknown, data: Uint8Array, invalid: (reason: string) => Error): FsNode {
  if (typeof entry !== "object" || entry === null) throw invalid("malformed manifest entry");
  const record = entry as Record<string, unknown>;
  if (record.kind === "dir") {
    if (typeof record.children !== "object" || record.children === null) throw invalid("directory without children");
    const children = new Map<string, FsNode>();
    for (const [name, child] of Object.entries(record.children)) {
      if (name === "" || name === "." || name === ".." || name.includes("/")) throw invalid(`invalid name '${name}'`);
      children.set(name, nodeFromManifest(child, data, invalid));
    }
    return { kind: "dir", children };
  }
  if (record.kind !== "file") throw invalid("unknown entry kind");
  const { offset, length } = record;
  if (!Number.isInteger(offset) || !Number.isInteger(length) || (offset as number) < 0 || (length as number) < 0 || (offset as number) + (length as number) > data.byteLength) {
    throw invalid("file bytes run past the end of the image");
  }
  const optionalString = (field: string) => {
    const value = record[field];
    if (value !== undefined && typeof value !== "string") throw invalid(`'${field}' is not a string`);
    return value as string | undefined;
  };
  let characterSetCode: CharacterSetCode | undefined;
  const charset = optionalString("characterSetCode");
  if (charset !== undefined) {
    if (!(Number(charset) in CHARACTER_SET_LABELS)) throw invalid(`unknown character set code '${charset}'`);
    characterSetCode = new CharacterSetCode(Number(charset) as CharacterSetCodelist);
  }
  let encodingCode: EncodingCode | undefined;
  const encoding = optionalString("encodingCode");
  if (encoding !== undefined) {
    const member = encodingCodelistFromCode(encoding);
    if (member === undefined) throw invalid(`unknown encoding code '${encoding}'`);
    encodingCode = new EncodingCode(member);
  }
  const mime = optionalString("mimeCode");
  const uri = optionalString("uri");
  let content: BinaryObject;
  try {
    content = {
      value: data.slice(offset as number, (offset as number) + (length as number)),
      format: optionalString("format"),
      mimeCode: mime !== undefined ? new MimeCode(mime) : undefined,
      encodingCode,
      characterSetCode,
      uri: uri !== undefined ? new Uri(uri) : undefined,
    };
  } catch (error) {
    throw invalid(error instanceof Error ? error.message : String(error));
  }
  return fileNode(content);
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const joined = new Uint8Array(a.byteLength + b.byteLength);
  joined.set(a, 0);
  joined.set(b, a.byteLength);
  return joined;
}

/** A Blob's bytes -- `Blob.arrayBuffer()` where the platform has it,
 * `FileReader` otherwise (this project's own jsdom test environment
 * implements only the latter). */
function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
