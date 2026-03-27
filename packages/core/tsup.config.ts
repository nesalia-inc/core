import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Ensure .js extensions in imports for ESM compliance
  esbuildOptions(options) {
    options.platform = "node";
  },
});
