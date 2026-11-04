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
 * │ Module Name     │ lira/common/ui/console_commands/shared
 * │ Filename        │ shared.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Helpers shared by Console commands: the multi-operand loop, byte
 * │                 │ formatting, and decoding a BinaryObject as text by its metadata.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/shared
 * @file shared.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { BinaryObject } from "../../../value_objects";

/** `mkdir`/`touch`/`cat`/`rm`'s own shared "keep going across multiple
 * operands" loop -- real bash doesn't abort `rm a b c` just because `a`
 * doesn't exist; it prints that one operand's own error and still
 * removes `b`/`c`. Each of those four commands calls `action(path)` for
 * every path in turn, catching per-path so one failure never swallows
 * the rest -- `ConsoleCommand.run()`'s own return-lines-not-throw
 * convention (types.ts) applies to the whole command, so a caught
 * per-operand error becomes one more returned line, not a thrown
 * exception. */
export function forEachOperand(paths: readonly string[], action: (path: string) => void): string[] {
  const lines: string[] = [];
  for (const path of paths) {
    try {
      action(path);
    } catch (error) {
      lines.push(error instanceof Error ? error.message : String(error));
    }
  }
  return lines;
}

/** `df`'s and `ps`'s own shared byte formatter -- `df -h`'s own
 * single-letter-suffix shape (`20.0M`, not `20971520`), one decimal
 * place past the first unit it doesn't fit in whole. A `G` tier exists
 * because `ps`'s own `%HEAP` column needs one -- a real
 * `performance.memory.jsHeapSizeLimit` is typically ~4 billion bytes,
 * which without it would print as an unreadable `3814.7M` instead of
 * the `3.7G` a real `df -h`/`ps aux` would show. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`;
}

/** Media types whose content is text even though their top-level type
 * isn't `text/` -- JSON, XML, YAML and script/source formats, plus any
 * `+json`/`+xml`/`+yaml` structured-syntax suffix (RFC 6839). */
const TEXTUAL_APPLICATION_TYPES = new Set(["application/json", "application/xml", "application/javascript", "application/ecmascript", "application/yaml", "application/sql", "application/toml"]);

export function isTextMediaType(mediaType: string): boolean {
  const type = mediaType.toLowerCase();
  return type.startsWith("text/") || TEXTUAL_APPLICATION_TYPES.has(type) || /\+(json|xml|yaml)$/.test(type);
}

/** `file`'s text as a string, decoded the way its own metadata says,
 * or why it can't be shown as text -- `cat`'s and `file`'s shared
 * reading of a BinaryObject. A non-text `mimeCode` is binary outright;
 * a `characterSetCode` is decoded with the first of its IANA labels
 * `TextDecoder` knows; failing that, an `encodingCode` with a browser
 * decoder (UTF-8, UTF-16, ASCII, ...) decides; with none of them, the
 * bytes are text only if they are valid UTF-8, the encoding every
 * Console write uses. */
export function decodeText(file: BinaryObject): { text: string } | { problem: string } {
  if (file.mimeCode && !isTextMediaType(file.mimeCode.value)) return { problem: `binary file (${file.mimeCode.value})` };
  let decoder: TextDecoder | undefined;
  let charsetName = "UTF-8";
  if (file.characterSetCode) {
    charsetName = file.characterSetCode.labels()[0];
    for (const label of file.characterSetCode.labels()) {
      try {
        decoder = new TextDecoder(label, { fatal: true });
        break;
      } catch {
        // not a label this platform's TextDecoder knows -- try the next alias
      }
    }
    if (!decoder) return { problem: `unsupported character set '${charsetName}'` };
  } else if (file.encodingCode) {
    charsetName = file.encodingCode.name;
    const label = file.encodingCode.decoderLabel;
    if (!label) return { problem: `unsupported encoding '${charsetName}'` };
    decoder = new TextDecoder(label, { fatal: true });
  } else {
    decoder = new TextDecoder("utf-8", { fatal: true });
  }
  try {
    return { text: decoder.decode(file.value) };
  } catch {
    return { problem: file.characterSetCode || file.encodingCode || file.mimeCode ? `not valid ${charsetName} text` : "binary file" };
  }
}

/** `base` and `name` joined with exactly one `/` between them. */
export function joinPath(base: string, name: string): string {
  return base.endsWith("/") ? `${base}${name}` : `${base}/${name}`;
}

/** The last segment of `path`, ignoring trailing slashes (`a/b/` is `b`). */
export function basename(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.slice(trimmed.lastIndexOf("/") + 1) || "/";
}
