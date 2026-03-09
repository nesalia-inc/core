/**
 * File System Operations Example
 *
 * This example demonstrates how to use @deessejs/core for:
 * - Safe file reading with Try/attempt
 * - Async file operations with AsyncResult
 * - Handling permission errors
 * - Directory traversal
 */

import { promises as fs, readdirSync } from "fs";
import * as fsSync from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { attempt, fromPromise, ok, err, okAsync, errAsync } from "@deessejs/core";

// ============================================================================
// Types
// ============================================================================

type FileError = {
  type: "NOT_FOUND" | "PERMISSION" | "PARSE" | "UNKNOWN";
  path: string;
  message: string;
};

type ConfigFile = {
  name: string;
  version: string;
  options: {
    debug: boolean;
    port: number;
  };
};

// ============================================================================
// Example 1: Safe file reading with Try
// ============================================================================

const readFileSyncSafe = (path: string): Result<string, FileError> => {
  console.log(`\n=== Example 1: Read File Sync (Safe) ===`);
  console.log(`  Reading: ${path}`);

  return attempt(() => require("fs").readFileSync(path, "utf-8"))
    .mapErr((error): FileError => {
      if (error.code === "ENOENT") {
        return {
          type: "NOT_FOUND",
          path,
          message: `File not found: ${path}`,
        };
      }
      if (error.code === "EACCES") {
        return {
          type: "PERMISSION",
          path,
          message: `Permission denied: ${path}`,
        };
      }
      return {
        type: "UNKNOWN",
        path,
        message: error.message,
      };
    })
    .match(
      (content) => {
        console.log(`✓ Read ${content.length} bytes`);
        return ok(content);
      },
      (error) => {
        console.log(`✗ ${error.message}`);
        return err(error);
      }
    );
}

// ============================================================================
// Example 2: Async file reading
// ============================================================================

const readFileAsync = async (path: string): Promise<Result<string, FileError>> => {
  console.log(`\n=== Example 2: Read File Async ===`);
  console.log(`  Reading: ${path}`);

  return fromPromise(fs.readFile(path, "utf-8"))
    .mapErr((error): FileError => {
      if (error.code === "ENOENT") {
        return {
          type: "NOT_FOUND",
          path,
          message: `File not found: ${path}`,
        };
      }
      return {
        type: "UNKNOWN",
        path,
        message: error.message,
      };
    })
    .match(
      (content) => {
        console.log(`✓ Read ${content.length} bytes`);
        return ok(content);
      },
      (error) => {
        console.log(`✗ ${error.message}`);
        return err(error);
      }
    );
}

// ============================================================================
// Example 3: Read and parse JSON config
// ============================================================================

const readConfigFile = async (path: string): Promise<Result<ConfigFile, FileError>> => {
  console.log(`\n=== Example 3: Read Config File ===`);
  console.log(`  Reading: ${path}`);

  return fromPromise(fs.readFile(path, "utf-8"))
    .mapErr((error): FileError => ({
      type: "NOT_FOUND",
      path,
      message: `Config file not found: ${path}`,
    }))
    .flatMap((content) => {
      // Parse JSON safely
      return attempt(() => JSON.parse(content) as ConfigFile).mapErr(
        (error): FileError => ({
          type: "PARSE",
          path,
          message: `Invalid JSON in config: ${error.message}`,
        })
      );
    })
    .flatMap((config) => {
      // Validate structure
      if (!config.name || typeof config.name !== "string") {
        return err<FileError>({
          type: "PARSE",
          path,
          message: "Missing or invalid 'name' field",
        });
      }
      if (!config.options || typeof config.options.debug !== "boolean") {
        return err<FileError>({
          type: "PARSE",
          path,
          message: "Missing or invalid 'options.debug' field",
        });
      }
      return ok(config);
    })
    .match(
      (config) => {
        console.log(`✓ Config loaded: ${config.name} v${config.version}`);
        return ok(config);
      },
      (error) => {
        console.log(`✗ ${error.message}`);
        return err(error);
      }
    );
}

// ============================================================================
// Example 4: Read directory contents
// ============================================================================

const readDirectory = async (path: string): Promise<Result<string[], FileError>> => {
  console.log(`\n=== Example 4: Read Directory ===`);
  console.log(`  Reading: ${path}`);

  return fromPromise(fs.readdir(path))
    .mapErr((error): FileError => ({
      type: "NOT_FOUND",
      path,
      message: `Directory not found: ${path}`,
    }))
    .match(
      (entries) => {
        console.log(`✓ Found ${entries.length} entries`);
        entries.forEach((entry) => console.log(`  - ${entry}`));
        return ok(entries);
      },
      (error) => {
        console.log(`✗ ${error.message}`);
        return err(error);
      }
    );
}

// ============================================================================
// Example 5: Recursive directory traversal
// ============================================================================

const findFilesByExtension = async (
  dir: string,
  extension: string
): Promise<Result<string[], FileError>> => {
  console.log(`\n=== Example 5: Find Files by Extension ===`);
  console.log(`  Searching ${dir} for *${extension}`);

  const results: string[] = [];

  const traverse = (currentPath: string): void => {
    let entries: fsSync.Dirent[];
    try {
      entries = fsSync.readdirSync(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        results.push(fullPath);
      }
    }
  }

  traverse(dir);

  console.log(`✓ Found ${results.length} files`);
  results.forEach((file) => console.log(`  - ${file}`));

  return ok(results);
}

// ============================================================================
// Example 6: Safe file writing with backup
// ============================================================================

const writeFileSafe = async (
  path: string,
  content: string
): Promise<Result<void, FileError>> => {
  console.log(`\n=== Example 6: Write File Safe ===`);
  console.log(`  Writing: ${path}`);

  // Create backup if file exists
  const backupResult = await fromPromise(fs.readFile(path, "utf-8"));

  if (backupResult.isOk()) {
    const backupPath = `${path}.backup`;
    console.log(`  Creating backup: ${backupPath}`);
    await fromPromise(fs.writeFile(backupPath, backupResult.value));
  }

  // Write new content
  return fromPromise(fs.writeFile(path, content))
    .mapErr((error): FileError => ({
      type: "UNKNOWN",
      path,
      message: `Failed to write file: ${error.message}`,
    }))
    .match(
      () => {
        console.log(`✓ File written successfully`);
        return ok(undefined);
      },
      (error) => {
        console.log(`✗ ${error.message}`);
        return err(error);
      }
    );
}

// ============================================================================
// Example 7: Read package.json from current directory
// ============================================================================

const readPackageJson = async (): Promise<Result<any, FileError>> => {
  console.log(`\n=== Example 7: Read package.json ===`);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packagePath = join(__dirname, "../../package.json");

  return readConfigFile(packagePath);
}

// ============================================================================
// Run all examples
// ============================================================================

const main = async () => {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   File System Operations with @deessejs/core              ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  try {
    // Example 1: Read this file
    readFileSyncSafe(__filename);

    // Example 2: Async read
    await readFileAsync(__filename);

    // Example 3: Read package.json
    await readPackageJson();

    // Example 4: Read directory
    await readDirectory(__dirname);

    // Example 5: Find .ts files
    await findFilesByExtension(__dirname, ".ts");

    // Example 6: Write file (in /tmp to be safe)
    const testFile = "/tmp/deessejs-test.txt";
    await writeFileSafe(testFile, "Hello from @deessejs/core!");

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   All examples completed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
