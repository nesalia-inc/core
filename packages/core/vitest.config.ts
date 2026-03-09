import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "**/*.test.ts"],
      thresholds: {
        lines: 99,
        functions: 85,
        branches: 98,
        statements: 99,
      },
    },
  },
});
