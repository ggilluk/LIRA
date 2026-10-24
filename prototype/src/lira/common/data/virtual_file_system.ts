/** VirtualFileSystem: an in-memory, Unix-shaped filesystem backing the
 * Console's own filesystem commands (`common/ui/console_commands/*.ts`)
 * -- a tree of directories and files rooted at `/`, capped at
 * `DEFAULT_FS_CAPACITY_BYTES` (20MB) total file content, the same way a
 * real disk image is a fixed-size blob a filesystem is carved out of
 * (`toBlob()` below makes that literal: the entire tree serialises down
 * to one real `Blob`, not just a numeric cap in a comment). Every
 * public method here corresponds to exactly one bash utility
 * (`changeDirectory` -> `cd`, `makeDirectory` -> `mkdir`, ...) and
 * throws that utility's own real bash error phrasing directly
 * (`"mkdir: cannot create directory 'x': File exists"`, not a generic
 * reason code a caller has to translate) -- there's exactly one
 * command file per method, so there's no reuse this indirection would
 * actually buy, and the whole point of fashioning this on bash is that
 * typing a bad command here reads like typing it in a real shell.
 *
 * Deliberately has no concept of permissions, timestamps, symlinks, or
 * multiple users -- "basic commands" (what was asked for), not a real
 * kernel's own VFS layer. `touch` on an existing file is accordingly a
 * no-op (no mtime to bump), not an error. */
export interface FsEntry {
  name: string;
  kind: "file" | "dir";
}

interface FileNode {
  kind: "file";
  content: string;
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

  /** Total bytes of file content currently stored, UTF-8-encoded the
   * same way `Blob`/`TextEncoder` measure a real file's own size --
   * recomputed by walking the whole tree rather than tracked
   * incrementally, since this scaffold's own tree is small enough
   * (20MB of plain text, at most) that a full walk costs nothing a
   * console command would ever notice. */
  usedBytes(): number {
    return sizeOf(this.root);
  }

  pwd(): string {
    return "/" + this.cwdPath.join("/");
  }

  changeDirectory(path: string): void {
    const segments = this.resolveSegments(path);
    const node = segments.length === 0 ? this.root : this.lookupNode(segments);
    if (!node) throw new Error(`cd: ${path}: No such file or directory`);
    if (node.kind !== "dir") throw new Error(`cd: ${path}: Not a directory`);
    this.cwdPath = segments;
  }

  /** `path` undefined lists the working directory, matching bash's own
   * bare `ls`. Listing a file path (not a directory) returns that one
   * entry by itself -- `ls`'s own real behaviour, not an error. */
  list(path?: string): readonly FsEntry[] {
    const segments = path === undefined ? this.cwdPath : this.resolveSegments(path);
    const node = segments.length === 0 ? this.root : this.lookupNode(segments);
    if (!node) throw new Error(`ls: cannot access '${path ?? "."}': No such file or directory`);
    if (node.kind === "file") return [{ name: segments[segments.length - 1], kind: "file" }];
    return [...node.children.entries()].map(([name, child]) => ({ name, kind: child.kind })).sort((a, b) => a.name.localeCompare(b.name));
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
   * class's own docstring on why there's no mtime here to bump. */
  touch(path: string): void {
    const segments = this.resolveSegments(path);
    if (segments.length === 0) throw new Error(`touch: cannot touch '${path}': Is a directory`);
    const parent = this.lookupParentDir(segments);
    const name = segments[segments.length - 1];
    if (!parent) throw new Error(`touch: cannot touch '${path}': No such file or directory`);
    if (parent.children.get(name)?.kind === "dir") throw new Error(`touch: cannot touch '${path}': Is a directory`);
    if (!parent.children.has(name)) parent.children.set(name, { kind: "file", content: "" });
  }

  /** `echo`'s own `>`/`>>` redirection target -- `options.append` picks
   * between the two. Enforces `capacityBytes` against the *projected*
   * total (current usage minus whatever this write replaces, plus the
   * new content), not just the new content's own size in isolation, so
   * overwriting a large file with a small one is never mistakenly
   * rejected as "out of space". */
  writeFile(path: string, content: string, options: { append?: boolean } = {}): void {
    const segments = this.resolveSegments(path);
    if (segments.length === 0) throw new Error(`${path}: Is a directory`);
    const parent = this.lookupParentDir(segments);
    const name = segments[segments.length - 1];
    if (!parent) throw new Error(`${path}: No such file or directory`);
    const existing = parent.children.get(name);
    if (existing?.kind === "dir") throw new Error(`${path}: Is a directory`);
    const nextContent = options.append && existing ? existing.content + content : content;
    const previousBytes = existing ? byteLength(existing.content) : 0;
    const nextBytes = byteLength(nextContent);
    if (this.usedBytes() - previousBytes + nextBytes > this.capacity) throw new Error(`${path}: No space left on device`);
    parent.children.set(name, { kind: "file", content: nextContent });
  }

  readFile(path: string): string {
    const segments = this.resolveSegments(path);
    const node = segments.length === 0 ? this.root : this.lookupNode(segments);
    if (!node) throw new Error(`cat: ${path}: No such file or directory`);
    if (node.kind !== "file") throw new Error(`cat: ${path}: Is a directory`);
    return node.content;
  }

  remove(path: string, options: { recursive?: boolean } = {}): void {
    const segments = this.resolveSegments(path);
    if (segments.length === 0) throw new Error(`rm: cannot remove '${path}': Device or resource busy`);
    const parent = this.lookupParentDir(segments);
    const name = segments[segments.length - 1];
    const node = parent?.children.get(name);
    if (!parent || !node) throw new Error(`rm: cannot remove '${path}': No such file or directory`);
    if (node.kind === "dir" && !options.recursive) throw new Error(`rm: cannot remove '${path}': Is a directory`);
    parent.children.delete(name);
  }

  /** Bash's own "moving onto an existing directory places the source
   * inside it, under its own basename" rule -- `resolveDestination()`
   * below is shared with `copy()` for exactly this reason, not
   * duplicated between the two. */
  move(source: string, destination: string): void {
    const sourceSegments = this.resolveSegments(source);
    const sourceParent = this.lookupParentDir(sourceSegments);
    const sourceName = sourceSegments[sourceSegments.length - 1];
    const node = sourceSegments.length > 0 ? sourceParent?.children.get(sourceName) : undefined;
    if (!sourceParent || !node) throw new Error(`mv: cannot stat '${source}': No such file or directory`);

    const target = this.resolveDestination(destination, sourceName);
    if (!target.parent) throw new Error(`mv: cannot move '${source}' to '${destination}': No such file or directory`);
    sourceParent.children.delete(sourceName);
    target.parent.children.set(target.name, node);
  }

  /** `options.recursive` mirrors `cp -r` -- copying a directory without
   * it is refused the same way the real utility refuses, not silently
   * flattened or silently ignored. A deep copy either way (`cloneNode()`
   * below): the source and the copy never share a mutable node, the
   * same "two Domains never share a mutable Word" discipline the
   * Vocabulary layer's own `seedFrom()` methods already follow for an
   * unrelated reason. */
  copy(source: string, destination: string, options: { recursive?: boolean } = {}): void {
    const sourceSegments = this.resolveSegments(source);
    const node = sourceSegments.length === 0 ? this.root : this.lookupNode(sourceSegments);
    if (!node) throw new Error(`cp: cannot stat '${source}': No such file or directory`);
    if (node.kind === "dir" && !options.recursive) throw new Error(`cp: -r not specified; omitting directory '${source}'`);

    const sourceName = sourceSegments[sourceSegments.length - 1] ?? "";
    const target = this.resolveDestination(destination, sourceName);
    if (!target.parent) throw new Error(`cp: cannot create '${destination}': No such file or directory`);
    if (this.usedBytes() + sizeOf(node) > this.capacity) throw new Error(`cp: ${destination}: No space left on device`);
    target.parent.children.set(target.name, cloneNode(node));
  }

  /** The canonical, serialisable form of this filesystem -- a real
   * `Blob`, not just a `capacityBytes` number named after one. Nothing
   * inside this class calls this itself; it exists for whatever
   * eventually wants to persist or download the virtual disk, the same
   * `Blob`/`URL.createObjectURL` pattern the Vocabulary layer's own
   * Save/Load feature already established (`common/ui/portal_shell.ts`'s
   * `downloadJsonFile()`), applied to this filesystem's own tree
   * instead of a seeded Domain's own stores. */
  toBlob(): Blob {
    return new Blob([JSON.stringify(serialize(this.root))], { type: "application/json" });
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
    const parentSegments = segments.slice(0, -1);
    const node = parentSegments.length === 0 ? this.root : this.lookupNode(parentSegments);
    return node?.kind === "dir" ? node : undefined;
  }

  /** `move()`/`copy()`'s own shared destination resolver -- if
   * `destination` already names a directory, the target becomes that
   * directory plus `fallbackName` (the source's own basename); otherwise
   * the target is `destination` itself, renamed/placed exactly there. */
  private resolveDestination(destination: string, fallbackName: string): { parent: DirectoryNode | undefined; name: string } {
    const destSegments = this.resolveSegments(destination);
    const destNode = destSegments.length === 0 ? this.root : this.lookupNode(destSegments);
    if (destNode?.kind === "dir") return { parent: destNode, name: fallbackName };
    return { parent: this.lookupParentDir(destSegments), name: destSegments[destSegments.length - 1] ?? fallbackName };
  }
}

function sizeOf(node: FsNode): number {
  if (node.kind === "file") return byteLength(node.content);
  let total = 0;
  for (const child of node.children.values()) total += sizeOf(child);
  return total;
}

function cloneNode(node: FsNode): FsNode {
  if (node.kind === "file") return { kind: "file", content: node.content };
  const children = new Map<string, FsNode>();
  for (const [name, child] of node.children) children.set(name, cloneNode(child));
  return { kind: "dir", children };
}

function serialize(node: FsNode): unknown {
  if (node.kind === "file") return { kind: "file", content: node.content };
  const children: Record<string, unknown> = {};
  for (const [name, child] of node.children) children[name] = serialize(child);
  return { kind: "dir", children };
}

function byteLength(content: string): number {
  return new TextEncoder().encode(content).length;
}
