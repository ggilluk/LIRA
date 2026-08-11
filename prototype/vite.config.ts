import { defineConfig } from "vitest/config";

export default defineConfig({
  root: ".",
  resolve: {
    alias: {
      lira: "/src/lira",
    },
  },
  test: {
    environment: "jsdom",
  },
});
