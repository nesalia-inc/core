/**
 * Post-build script to add .js extensions to ESM imports
 * Node.js ESM requires explicit .js extensions on relative imports
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, "..", "dist");

function addJsExtension(path) {
  // Skip if already has .js extension or has query params/hash
  if (path.endsWith(".js") || path.includes("?") || path.includes("#")) {
    return path;
  }
  // Skip if it's a directory import (will resolve to index.js)
  if (!extname(path)) {
    return `${path}.js`;
  }
  return path;
}

function processFile(filePath) {
  let content = readFileSync(filePath, "utf8");
  let original = content;

  // Handle: export { x, y } from './foo'
  // Also handles: export { x as y } from './foo'
  content = content.replace(/export\s+\{[^}]+\}\s+from\s+['"](\.\/[^'"]*?)['"]/g, (match, path) => {
    const newPath = addJsExtension(path);
    if (newPath === path) return match;
    return match.replace(`'${path}'`, `'${newPath}'`).replace(`"${path}"`, `"${newPath}"`);
  });

  // Handle: export * from './foo'
  content = content.replace(/export\s+\*\s+from\s+['"](\.\/[^'"]*?)['"]/g, (match, path) => {
    const newPath = addJsExtension(path);
    if (newPath === path) return match;
    return match.replace(`'${path}'`, `'${newPath}'`);
  });

  // Handle: import x from './foo'
  // Also handles: import { x } from './foo', import * as x from './foo'
  content = content.replace(/import\s+[^'"]+from\s+['"](\.\/[^'"]*?)['"]/g, (match, path) => {
    const newPath = addJsExtension(path);
    if (newPath === path) return match;
    return match.replace(`'${path}'`, `'${newPath}'`);
  });

  // Handle: import('./foo') - dynamic import
  content = content.replace(/import\s*\(['"](\.\/[^'"]*?)['"]\)/g, (match, path) => {
    const newPath = addJsExtension(path);
    if (newPath === path) return match;
    return match.replace(`'${path}'`, `'${newPath}'`);
  });

  if (content !== original) {
    writeFileSync(filePath, content);
  }
}

function walkDir(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile() && extname(entry.name) === ".js") {
      processFile(fullPath);
    }
  }
}

walkDir(distDir);
