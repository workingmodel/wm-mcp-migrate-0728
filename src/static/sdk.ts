import fs from "fs";
import path from "path";
import {
  PKG_PY_FASTMCP_STANDALONE,
  PKG_PY_MCP,
  PKG_TS_SDK_V1,
  PKG_TS_SERVER_V2,
  PY_FASTMCP_IMPORT,
  PY_SDK_MIN_VERSION,
  SDK_OPT_IN_ENTRY_POINTS,
  SDK_OPT_IN_HTTP,
} from "../spec-constants.js";
import type { SdkInfo } from "../types.js";

function readText(file: string): string | null {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function readJson(file: string): Record<string, unknown> | null {
  const text = readText(file);
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

function parseVersion(v: string): number[] {
  return v.split(".").map((p) => parseInt(p, 10) || 0);
}

// -1 / 0 / 1, padding missing parts with 0 ("2" == "2.0.0")
function compareVersions(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/**
 * Classifies a PEP 440-ish specifier (">=1.28,<2") against the 2.0.0 threshold.
 * "v1" = provably below it, "v2" = provably at/above it, "unknown" = no parseable bound.
 */
export function classifyPySpecifier(spec: string): "v1" | "v2" | "unknown" {
  const min = parseVersion(PY_SDK_MIN_VERSION);
  let v1 = false;
  let v2 = false;
  for (const clause of spec.split(",")) {
    const m = clause.trim().match(/^(===|==|~=|>=|<=|>|<)\s*([0-9][\w.*]*)/);
    if (!m) continue;
    const op = m[1];
    const cmp = compareVersions(parseVersion(m[2]!.replace(/\.?\*$/, "")), min);
    if (op === "<") {
      if (cmp <= 0) v1 = true;
    } else if (op === "<=") {
      if (cmp < 0) v1 = true;
    } else if (op === "==" || op === "===" || op === "~=") {
      if (cmp < 0) v1 = true;
      else v2 = true;
    } else if (op === ">=" || op === ">") {
      if (cmp >= 0) v2 = true;
    }
  }
  if (v1) return "v1";
  if (v2) return "v2";
  return "unknown";
}

// Finds `pkg<extras><specifier>` as a dependency entry: at line start (requirements.txt) or
// right after a quote (pyproject arrays). Returns each specifier string found.
function pySpecifiers(text: string, pkg: string): string[] {
  const re = new RegExp(`(?:^|["'])\\s*${escapeRe(pkg)}(?:\\[[^\\]]*\\])?(?![\\w.-])([^"'\\n#;]*)`, "gm");
  return [...text.matchAll(re)].map((m) => m[1] ?? "");
}

function pyManifests(root: string): string {
  let out = readText(path.join(root, "pyproject.toml")) ?? "";
  try {
    for (const name of fs.readdirSync(root)) {
      if (/^requirements.*\.txt$/.test(name)) out += "\n" + (readText(path.join(root, name)) ?? "");
    }
  } catch {
    // unreadable root — nothing to add
  }
  return out;
}

/**
 * Detects which official MCP SDK (if any) the scanned project is built on. Reads only the
 * ROOT manifests (package.json, pyproject.toml, requirements*.txt) and the one installed
 * package.json for the SDK — never walks node_modules. Monorepo subpackages are not followed.
 */
export function detectSdk(root: string, allContent: string): SdkInfo {
  const none: SdkInfo = { kind: "none", validatesRoutingHeaders: false };

  // ── TypeScript / JavaScript ──
  const pkg = readJson(path.join(root, "package.json"));
  const deps = {
    ...((pkg?.dependencies as Record<string, string> | undefined) ?? {}),
    ...((pkg?.devDependencies as Record<string, string> | undefined) ?? {}),
  };
  const hasV2 = PKG_TS_SERVER_V2 in deps || allContent.includes(PKG_TS_SERVER_V2);
  const hasV1 = PKG_TS_SDK_V1 in deps || allContent.includes(PKG_TS_SDK_V1);

  if (hasV2) {
    const optedIn = SDK_OPT_IN_ENTRY_POINTS.some((n) => allContent.includes(n));
    return optedIn
      ? { kind: "ts-v2-optedin", validatesRoutingHeaders: allContent.includes(SDK_OPT_IN_HTTP) }
      : { kind: "ts-v2-not-optedin", validatesRoutingHeaders: false };
  }
  if (hasV1) {
    const installed = readJson(path.join(root, "node_modules", ...PKG_TS_SDK_V1.split("/"), "package.json"));
    const installedVersion = typeof installed?.version === "string" ? installed.version : undefined;
    return { kind: "ts-v1", installedVersion, validatesRoutingHeaders: false };
  }

  // ── Python ──
  const manifests = pyManifests(root);
  const mcpSpecs = pySpecifiers(manifests, PKG_PY_MCP);
  const importsV1Path = allContent.includes(PY_FASTMCP_IMPORT);
  const importsMcp = new RegExp(`^\\s*(from|import)\\s+${escapeRe(PKG_PY_MCP)}(\\.|\\s|$)`, "m").test(allContent);

  if (mcpSpecs.length > 0 || importsMcp || importsV1Path) {
    const classes = mcpSpecs.map(classifyPySpecifier);
    // A 1.x import path is decisive even if the manifest claims 2.x (v2 removed that module).
    if (importsV1Path || classes.includes("v1")) return { kind: "py-v1", validatesRoutingHeaders: false };
    if (classes.includes("v2")) return { kind: "py-v2", validatesRoutingHeaders: true };
    return { kind: "py-unknown", validatesRoutingHeaders: false };
  }

  const importsFastmcp = new RegExp(`^\\s*(from|import)\\s+${escapeRe(PKG_PY_FASTMCP_STANDALONE)}\\b`, "m").test(allContent);
  if (pySpecifiers(manifests, PKG_PY_FASTMCP_STANDALONE).length > 0 || importsFastmcp) {
    return { kind: "fastmcp-standalone", validatesRoutingHeaders: false };
  }

  return none;
}
