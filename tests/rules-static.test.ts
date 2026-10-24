import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { r1Sessions } from "../src/rules/r1-sessions.js";
import { r2Headers } from "../src/rules/r2-headers.js";
import { r3ErrorCode } from "../src/rules/r3-error-code.js";
import { r4TtlMs } from "../src/rules/r4-ttl-ms.js";
import { r5TraceContext } from "../src/rules/r5-trace-context.js";
import { r6Deprecated } from "../src/rules/r6-deprecated.js";
import { r7Discover } from "../src/rules/r7-discover.js";
import { r8Mrtr } from "../src/rules/r8-mrtr.js";
import { r9Tasks } from "../src/rules/r9-tasks.js";
import { r10AuthIss } from "../src/rules/r10-auth-iss.js";
import { r11Removed } from "../src/rules/r11-removed.js";
import { r12ResultType } from "../src/rules/r12-result-type.js";
import { r13Sdk } from "../src/rules/r13-sdk.js";
import { CORE_RULES } from "../src/rules/index.js";
import { buildStaticContext } from "../src/static/scan.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");

function ctxFor(name: string) {
  return buildStaticContext(path.join(FIXTURES, name));
}

// ─── R1 — Sessions (TS + Python) ────────────────────────────────────────────

describe("R1 sessions — static", () => {
  it("flags a TS server that uses Mcp-Session-Id and an initialize handshake", () => {
    const findings = r1Sessions.staticCheck!(ctxFor("r1-sessions-bad-ts"));
    expect(findings.some((f) => f.severity === "error")).toBe(true);
    expect(findings.some((f) => /Mcp-Session-Id/.test(f.message))).toBe(true);
  });

  it("flags a Python server that uses Mcp-Session-Id and an initialize handshake", () => {
    const findings = r1Sessions.staticCheck!(ctxFor("r1-sessions-bad-py"));
    expect(findings.some((f) => f.severity === "error")).toBe(true);
  });

  it("does not flag a clean TS server that reads the namespaced protocolVersion key and skips sessions", () => {
    const findings = r1Sessions.staticCheck!(ctxFor("r1-sessions-clean-ts"));
    expect(findings).toHaveLength(0);
  });

  it("flags a server that reads _meta but never references io.modelcontextprotocol/protocolVersion", () => {
    const findings = r1Sessions.staticCheck!(ctxFor("r1-meta-no-version-ts"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toContain("io.modelcontextprotocol/protocolVersion");
    expect(findings[0]?.message).toContain("reads _meta");
  });

  it("flags a server with no _meta handling at all", () => {
    const findings = r1Sessions.staticCheck!(ctxFor("r2-headers-bad-ts"));
    expect(findings.some((f) => f.message.includes("No request handler reads"))).toBe(true);
  });
});

// ─── R2 — Headers (TS + Python) ─────────────────────────────────────────────

describe("R2 headers — static", () => {
  it("flags a TS HTTP server that never validates Mcp-Method/Mcp-Name", () => {
    const findings = r2Headers.staticCheck!(ctxFor("r2-headers-bad-ts"));
    expect(findings.some((f) => f.severity === "error")).toBe(true);
  });

  it("flags a Python HTTP server that never validates Mcp-Method/Mcp-Name", () => {
    const findings = r2Headers.staticCheck!(ctxFor("r2-headers-bad-py"));
    expect(findings.some((f) => f.severity === "error")).toBe(true);
  });

  it("does not flag a clean TS server that validates both headers", () => {
    const findings = r2Headers.staticCheck!(ctxFor("r2-headers-clean-ts"));
    expect(findings).toHaveLength(0);
  });
});

// ─── R3 — Error code ─────────────────────────────────────────────────────────

describe("R3 error code — static", () => {
  it("flags hardcoded legacy -32002 error code, at error severity", () => {
    const findings = r3ErrorCode.staticCheck!(ctxFor("r3-error-code-bad-ts"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toContain("-32602");
    expect(findings[0]?.message).not.toMatch(/verify against|once confirmed/i);
  });

  it("does not flag a server using a named constant instead of the raw legacy code", () => {
    const findings = r3ErrorCode.staticCheck!(ctxFor("r3-error-code-clean-ts"));
    expect(findings).toHaveLength(0);
  });
});

// ─── R4 — Cache metadata ──────────────────────────────────────────────────────

describe("R4 cache metadata — static", () => {
  it("flags a list builder that sets neither ttlMs nor cacheScope (one finding each, errors)", () => {
    const findings = r4TtlMs.staticCheck!(ctxFor("r4-ttl-ms-bad-ts"));
    expect(findings).toHaveLength(2);
    expect(findings.every((f) => f.severity === "error")).toBe(true);
    expect(findings.some((f) => f.message.includes("ttlMs"))).toBe(true);
    expect(findings.some((f) => f.message.includes("cacheScope"))).toBe(true);
    expect(findings.every((f) => f.message.includes("REQUIRED"))).toBe(true);
  });

  it("flags only the missing cacheScope when ttlMs is set (resources/read trigger)", () => {
    const findings = r4TtlMs.staticCheck!(ctxFor("r4-cache-scope-missing-ts"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain("cacheScope");
  });

  it("triggers on prompts/list too", () => {
    const findings = r4TtlMs.staticCheck!(ctxFor("r4-prompts-bad-ts"));
    expect(findings).toHaveLength(2);
  });

  it("does not flag a list builder that sets both ttlMs and cacheScope", () => {
    const findings = r4TtlMs.staticCheck!(ctxFor("r4-ttl-ms-clean-ts"));
    expect(findings).toHaveLength(0);
  });

  it("does not flag a project with no list/read endpoints", () => {
    expect(r4TtlMs.staticCheck!(ctxFor("r7-non-mcp-ts"))).toHaveLength(0);
  });
});

// ─── R5 — Trace Context ──────────────────────────────────────────────────────

describe("R5 trace context — static", () => {
  it("flags OTel usage with no W3C Trace Context propagation via _meta", () => {
    const findings = r5TraceContext.staticCheck!(ctxFor("r5-trace-bad-ts"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
  });

  it("does not flag a server that reads traceparent/tracestate from _meta", () => {
    const findings = r5TraceContext.staticCheck!(ctxFor("r5-trace-clean-ts"));
    expect(findings).toHaveLength(0);
  });
});

// ─── R6 — Deprecated (TS + Python) ──────────────────────────────────────────

describe("R6 deprecated — static", () => {
  it("flags roots + sampling capability declarations in TS", () => {
    const findings = r6Deprecated.staticCheck!(ctxFor("r6-deprecated-bad-ts"));
    const ruleIds = findings.map((f) => f.message);
    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(ruleIds.some((m) => m.includes("roots"))).toBe(true);
    expect(ruleIds.some((m) => m.includes("sampling"))).toBe(true);
    expect(findings.every((f) => f.severity === "warning")).toBe(true);
    expect(findings.every((f) => f.message.includes("on or after 2027-07-28"))).toBe(true);
  });

  it("flags logging capability declaration in Python", () => {
    const findings = r6Deprecated.staticCheck!(ctxFor("r6-deprecated-bad-py"));
    expect(findings.some((f) => f.message.includes("logging"))).toBe(true);
  });

  it("does not flag a server with no deprecated capabilities declared", () => {
    const findings = r6Deprecated.staticCheck!(ctxFor("r6-deprecated-clean-ts"));
    expect(findings).toHaveLength(0);
  });
});

// ─── R7 — server/discover ────────────────────────────────────────────────────

describe("R7 discovery — static", () => {
  it("flags an MCP server with no server/discover handler", () => {
    const findings = r7Discover.staticCheck!(ctxFor("r7-discover-bad-ts"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
  });

  it("does not flag a server that references server/discover", () => {
    expect(r7Discover.staticCheck!(ctxFor("r7-discover-clean-ts"))).toHaveLength(0);
  });

  it("does not flag a project that is not an MCP server", () => {
    expect(r7Discover.staticCheck!(ctxFor("r7-non-mcp-ts"))).toHaveLength(0);
  });
});

// ─── R8 — Multi Round-Trip Requests ──────────────────────────────────────────

describe("R8 MRTR — static", () => {
  it("flags server-initiated sampling/elicitation requests without InputRequiredResult", () => {
    const findings = r8Mrtr.staticCheck!(ctxFor("r8-mrtr-bad-ts"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toContain("sampling/createMessage");
    expect(findings[0]?.message).toContain("elicitation/create");
  });

  it("does not flag a server that returns InputRequiredResult", () => {
    expect(r8Mrtr.staticCheck!(ctxFor("r8-mrtr-clean-ts"))).toHaveLength(0);
  });

  it("does not mistake notifications/roots/list_changed for a roots/list request", () => {
    expect(r8Mrtr.staticCheck!(ctxFor("r11-removed-bad-ts"))).toHaveLength(0);
  });

  it("does NOT flag a server that never issues server-initiated requests (no false positive)", () => {
    expect(r8Mrtr.staticCheck!(ctxFor("r8-no-initiated-ts"))).toHaveLength(0);
  });
});

// ─── R9 — Tasks ──────────────────────────────────────────────────────────────

describe("R9 tasks — static", () => {
  it("flags tasks/list and points at tasks/get, tasks/update and the extension", () => {
    const findings = r9Tasks.staticCheck!(ctxFor("r9-tasks-bad-ts"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.fix).toContain("tasks/get");
    expect(findings[0]?.fix).toContain("tasks/update");
    expect(findings[0]?.fix).toContain("io.modelcontextprotocol/tasks");
  });

  it("does not flag tasks/get + tasks/update", () => {
    expect(r9Tasks.staticCheck!(ctxFor("r9-tasks-clean-ts"))).toHaveLength(0);
  });
});

// ─── R10 — Auth iss ──────────────────────────────────────────────────────────

describe("R10 auth iss — static", () => {
  it("warns when authorization code has no iss handling", () => {
    const findings = r10AuthIss.staticCheck!(ctxFor("r10-auth-iss-bad-ts"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
  });

  it("does not flag authorization code that handles iss", () => {
    expect(r10AuthIss.staticCheck!(ctxFor("r10-auth-iss-clean-ts"))).toHaveLength(0);
  });

  it("does not flag a project with no auth code", () => {
    expect(r10AuthIss.staticCheck!(ctxFor("r7-non-mcp-ts"))).toHaveLength(0);
  });
});

// ─── R11 — Removed methods ───────────────────────────────────────────────────

describe("R11 removed methods — static", () => {
  it("emits one error per removed literal, each with a replacement in fix", () => {
    const findings = r11Removed.staticCheck!(ctxFor("r11-removed-bad-ts"));
    expect(findings).toHaveLength(7);
    expect(findings.every((f) => f.severity === "error")).toBe(true);
    for (const literal of [
      '"ping"',
      "logging/setLevel",
      "notifications/roots/list_changed",
      "resources/subscribe",
      "resources/unsubscribe",
      "notifications/elicitation/complete",
      "Last-Event-ID",
    ]) {
      expect(findings.some((f) => f.message.includes(literal))).toBe(true);
    }
    expect(findings.find((f) => f.message.includes("resources/subscribe"))?.fix).toContain("subscriptions/listen");
    expect(findings.find((f) => f.message.includes("logging/setLevel"))?.fix).toContain("io.modelcontextprotocol/logLevel");
    expect(findings.every((f) => f.fix.length > 0)).toBe(true);
  });

  it("does not flag a server using subscriptions/listen", () => {
    expect(r11Removed.staticCheck!(ctxFor("r11-removed-clean-ts"))).toHaveLength(0);
  });

  it("does not flag the bare word / identifier ping (negative)", () => {
    expect(r11Removed.staticCheck!(ctxFor("r11-ping-bareword-ts"))).toHaveLength(0);
  });
});

// ─── R12 — resultType ────────────────────────────────────────────────────────

describe("R12 resultType — static", () => {
  it("flags a server that handles tools/call but never references resultType", () => {
    const findings = r12ResultType.staticCheck!(ctxFor("r12-result-type-bad-ts"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
  });

  it("does not flag a server that sets resultType", () => {
    expect(r12ResultType.staticCheck!(ctxFor("r12-result-type-clean-ts"))).toHaveLength(0);
  });

  it("does not flag a project that handles neither tools/call nor tools/list", () => {
    expect(r12ResultType.staticCheck!(ctxFor("r7-non-mcp-ts"))).toHaveLength(0);
  });
});

// ─── Whole-core sanity ───────────────────────────────────────────────────────

describe("fully clean fixture", () => {
  it("produces zero findings across every core rule", () => {
    const ctx = ctxFor("fully-clean-ts");
    const findings = CORE_RULES.flatMap((r) => r.staticCheck?.(ctx) ?? []);
    expect(findings).toEqual([]);
  });
});

// ─── R13 — SDK detection + plumbing suppression ─────────────────────────────

function coreFindings(name: string) {
  const ctx = ctxFor(name);
  return CORE_RULES.flatMap((r) => r.staticCheck?.(ctx) ?? []);
}

describe("R13 SDK — static", () => {
  it("ts-v1: exactly one error (R13), no R1-meta / R4 / R7 / R12 plumbing noise", () => {
    const findings = coreFindings("sdk-ts-v1");
    const errors = findings.filter((f) => f.severity === "error");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleId).toBe("R13");
    expect(errors[0]?.message).toContain("@modelcontextprotocol/sdk");
    expect(findings.some((f) => ["R4", "R7", "R12"].includes(f.ruleId))).toBe(false);
  });

  it("ts-v2 opted in: R13 info only, no errors", () => {
    const findings = coreFindings("sdk-ts-v2-optedin");
    expect(findings.filter((f) => f.severity === "error")).toEqual([]);
    expect(findings.find((f) => f.ruleId === "R13")?.severity).toBe("info");
  });

  it("ts-v2 not opted in: R13 error", () => {
    const findings = r13Sdk.staticCheck!(ctxFor("sdk-ts-v2-not-optedin"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toContain("never opts in");
  });

  it("py mcp>=2: no errors", () => {
    const findings = coreFindings("sdk-py-v2");
    expect(findings.filter((f) => f.severity === "error")).toEqual([]);
    expect(ctxFor("sdk-py-v2").sdk.kind).toBe("py-v2");
  });

  it("py mcp>=1.28,<2: R13 error", () => {
    const findings = r13Sdk.staticCheck!(ctxFor("sdk-py-v1"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.fix).toContain("MCPServer");
  });

  it("py `from mcp.server.fastmcp import FastMCP` (no manifest): R13 error", () => {
    const findings = r13Sdk.staticCheck!(ctxFor("sdk-py-fastmcp-import"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
  });

  it("py mcp with no version bound: info", () => {
    expect(r13Sdk.staticCheck!(ctxFor("sdk-py-unknown"))[0]?.severity).toBe("info");
  });

  it("standalone fastmcp: info", () => {
    const findings = r13Sdk.staticCheck!(ctxFor("sdk-py-fastmcp-standalone"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("info");
  });

  it("author-owned rules still fire under a v2 opted-in SDK (R8 via elicitInput)", () => {
    const findings = coreFindings("sdk-ts-v2-mrtr-bad");
    expect(findings.some((f) => f.ruleId === "R8" && f.severity === "error")).toBe(true);
  });

  it("hand-rolled servers (no SDK) are unchanged and emit no R13", () => {
    expect(ctxFor("r1-sessions-bad-ts").sdk.kind).toBe("none");
    expect(coreFindings("fully-clean-ts")).toEqual([]);
    expect(r7Discover.staticCheck!(ctxFor("r7-discover-bad-ts"))).toHaveLength(1);
  });

  it("keeps R1's session/handshake finding when the literal is in author code, but drops the protocolVersion one", () => {
    const ctx = ctxFor("r1-sessions-bad-ts");
    ctx.sdk = { kind: "ts-v1", validatesRoutingHeaders: false };
    const findings = r1Sessions.staticCheck!(ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain("Mcp-Session-Id");
  });

  it("R2 is suppressed only when the SDK entry point validates routing headers", () => {
    const ctx = ctxFor("r2-headers-bad-ts");
    expect(r2Headers.staticCheck!(ctx)).toHaveLength(1);
    ctx.sdk = { kind: "ts-v1", validatesRoutingHeaders: false };
    expect(r2Headers.staticCheck!(ctx)).toHaveLength(1);
    ctx.sdk = { kind: "ts-v2-optedin", validatesRoutingHeaders: true };
    expect(r2Headers.staticCheck!(ctx)).toHaveLength(0);
  });
});
