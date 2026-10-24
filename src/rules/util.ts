import { CACHEABLE_METHODS, MCP_SERVER_HINT, METHOD_TOOLS_CALL } from "../spec-constants.js";
import type { Finding, StaticContext } from "../types.js";

// Heuristic gate for the "is this even an MCP server?" question, so server-only rules
// (R7, R12) stay quiet on unrelated projects the user happens to scan.
export function looksLikeMcpServer(ctx: StaticContext): boolean {
  return (
    MCP_SERVER_HINT.test(ctx.allContent) ||
    ctx.allContent.includes(METHOD_TOOLS_CALL) ||
    CACHEABLE_METHODS.some((m) => ctx.allContent.includes(m))
  );
}

export function staticFinding(
  ruleId: string,
  severity: Finding["severity"],
  specRef: string,
  message: string,
  fix: string
): Finding {
  return { ruleId, severity, source: "static", message, fix, specRef };
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
