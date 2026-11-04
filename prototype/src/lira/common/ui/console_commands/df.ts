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
 * │ Description     │ Console `df` command: reports the virtual filesystem's size,
 * │                 │ used and free space in `df -h` form.
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
import { formatBytes } from "./shared";

/** `df -h`'s own shape, for the one filesystem this Console has --
 * `blobfs` names it after `VirtualFileSystem.toBlob()`'s own
 * "the whole tree is really one Blob" framing (data/virtual_file_system.ts),
 * not a generic placeholder name. */
export const dfCommand: ConsoleCommand = {
  name: "df",
  description: "show virtual filesystem capacity usage",
  run: ({ fs }) => {
    const used = fs.usedBytes();
    const capacity = fs.capacityBytes;
    const usePercent = capacity === 0 ? 0 : Math.round((used / capacity) * 100);
    return [
      "Filesystem      Size    Used    Avail   Use%",
      `blobfs          ${formatBytes(capacity).padEnd(8)}${formatBytes(used).padEnd(8)}${formatBytes(capacity - used).padEnd(8)}${usePercent}%`,
    ];
  },
};
