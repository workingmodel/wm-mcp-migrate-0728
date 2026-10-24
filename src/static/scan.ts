import fs from "fs";
import path from "path";
import { detectSdk } from "./sdk.js";
import type { SourceFile, StaticContext } from "../types.js";

// File extensions this tool understands — TS/JS and Python, the two dominant MCP server languages.
const TS_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const PY_EXTENSIONS = new Set([".py"]);

// Directories to skip when walking a project.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
  "venv",
  ".venv",
  "__pycache__",
  ".mypy_cache",
  ".pytest_cache",
  "site-packages",
]);

function langFor(ext: string): SourceFile["lang"] {
  if (TS_EXTENSIONS.has(ext)) return "ts";
  if (PY_EXTENSIONS.has(ext)) return "py";
  return "other";
}

function walk(root: string, current: string, out: SourceFile[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(current, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(root, full, out);
      continue;
    }
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name);
    const lang = langFor(ext);
    if (lang === "other") continue;

    try {
      const content = fs.readFileSync(full, "utf8");
      out.push({ path: path.relative(root, full), content, lang });
    } catch {
      // unreadable file — skip
    }
  }
}

export function buildStaticContext(root: string): StaticContext {
  const files: SourceFile[] = [];
  walk(root, root, files);

  const allContent = files.map((f) => f.content).join("\n");
  return { root, files, allContent, sdk: detectSdk(root, allContent) };
}
