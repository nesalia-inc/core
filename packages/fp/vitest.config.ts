import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "**/*.test.ts"],
      thresholds: {
        lines: 85,
        functions: 75,
        branches: 90,
        statements: 85,
      },
    },
    // Type testing configuration
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.types.json",
    },
  },
});
