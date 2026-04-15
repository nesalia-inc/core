import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import security from "eslint-plugin-security";
import importPlugin from "eslint-plugin-import";

const securityPlugin = security;
const importPluginResolved = importPlugin;

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    ignores: [
      "node_modules",
      "dist",
      "build",
      ".turbo",
      "*.config.js",
      "**/*.test-d.ts",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      security: securityPlugin,
      import: importPluginResolved,
      unicorn,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      // Qualite du Code & Robustesse
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-floating-promises": "error",
      complexity: ["error", 10],
      "sonarjs/cognitive-complexity": ["error", 15],
      "@typescript-eslint/explicit-function-return-type": "off", // Too strict for this project

      // Performance
      "no-await-in-loop": "warn",
      "@typescript-eslint/no-misused-promises": "warn",

      // Import / Maintenance
      "import/no-unused-modules": "warn",
      "import/no-extraneous-dependencies": "error",

      // Unicorn (sensible subset)
      "unicorn/better-regex": "off", // Breaks with complex regex
      "unicorn/catch-error-name": "warn",
      "unicorn/consistent-function-scoping": "off", // Too aggressive
      "unicorn/filename-case": "off", // Disabled for this project
      "unicorn/new-for-builtins": "warn",
      "unicorn/no-abusive-eslint-disable": "error",
      "unicorn/no-instanceof-array": "error",
      "unicorn/no-instanceof-builtins": "error",
      "unicorn/no-new-buffer": "error",
      "unicorn/no-unreadable-array-destructuring": "warn",
      "unicorn/no-zero-fractions": "error",
      "unicorn/number-literal-case": "error",
      "unicorn/prefer-add-event-listener": "warn",
      "unicorn/prefer-array-find": "error",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-modern-dom-apis": "error",
      "unicorn/prefer-negative-index": "error",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-number-properties": "error",
      "unicorn/prefer-optional-catch-binding": "error",
      "unicorn/prefer-string-slice": "error",
      "unicorn/prefer-ternary": "off", // Ternaries can be harder to read
      "unicorn/throw-new-error": "error",

      // Security
      "security/detect-object-injection": "warn",
      "security/detect-unsafe-regex": "error",

      // Existing rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  }
);