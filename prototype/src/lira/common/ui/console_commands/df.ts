import type { ConsoleCommand } from "./types";

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}
