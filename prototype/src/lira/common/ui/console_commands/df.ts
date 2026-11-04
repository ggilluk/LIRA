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
 * │ Module Name     │ lira/common/ui/console_commands/df
 * │ Filename        │ df.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `df` command: reports virtual filesystem capacity in 1K
 * │                 │ blocks, or human-readable with -h.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/df
 * @file df.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ConsoleCommand } from "./types";
import { commandWithOptions } from "./options";
import { formatBytes } from "./shared";

/** `df`'s own shape, for the one filesystem this Console has --
 * `blobfs` names it after `VirtualFileSystem.toBlob()`'s own "the
 * whole tree is one disk image" framing (data/virtual_file_system.ts).
 * Sizes are 1K blocks by default, as real `df` prints them, and
 * human-readable with `-h`. */
export const dfCommand: ConsoleCommand = commandWithOptions({
  name: "df",
  description: "show virtual filesystem capacity usage",
  usage: "[OPTION]...",
  summary: "Show how much of the virtual filesystem is used and free.",
  options: [{ name: "human", short: "h", long: "human-readable", description: "print sizes in powers of 1024 (e.g., 1023M)" }],
  run: ({ fs, flags }) => {
    const used = fs.usedBytes();
    const capacity = fs.capacityBytes;
    const usePercent = capacity === 0 ? 0 : Math.round((used / capacity) * 100);
    if (flags.has("human")) {
      return [
        "Filesystem      Size    Used    Avail   Use%",
        `blobfs          ${formatBytes(capacity).padEnd(8)}${formatBytes(used).padEnd(8)}${formatBytes(capacity - used).padEnd(8)}${usePercent}%`,
      ];
    }
    const blocks = (bytes: number) => String(Math.ceil(bytes / 1024));
    return [
      "Filesystem     1K-blocks    Used Available Use%",
      `blobfs         ${blocks(capacity).padStart(9)} ${blocks(used).padStart(7)} ${blocks(capacity - used).padStart(9)} ${`${usePercent}%`.padStart(4)}`,
    ];
  },
});
