import { defineConfig } from "vitest/config";

export default defineConfig({
  root: ".",
  resolve: {
    alias: {
      lira: "/src/lira",
    },
  },
  // Both workers are already instantiated with { type: "module" }
  // (linguistics_worker_client.ts, vocabulary_worker_client.ts), so
  // there's no legacy-browser IIFE fallback to preserve. Needs to be
  // "es", not Vite's default "iife", now that wordnet_loader.ts's own
  // lazy `import()` (its own docstring) makes vocabulary_worker.ts's
  // bundle a code-split one -- Rollup's IIFE/UMD output formats can't
  // represent more than one chunk.
  worker: {
    format: "es",
  },
  test: {
    environment: "jsdom",
  },
});
