import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { r1Sessions } from "../src/rules/r1-sessions.js";
import { r2Headers } from "../src/rules/r2-headers.js";
import { r3ErrorCode } from "../src/rules/r3-error-code.js";
import { r4TtlMs } from "../src/rules/r4-ttl-ms.js";
import { r5TraceContext } from "../src/rules/r5-trace-context.js";
import { r6Deprecated } from "../src/rules/r6-deprecated.js";
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

  it("does not flag a clean TS server that reads _meta and skips sessions", () => {
    const findings = r1Sessions.staticCheck!(ctxFor("r1-sessions-clean-ts"));
    expect(findings).toHaveLength(0);
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
  it("flags hardcoded legacy -32002 error code, at warning severity", () => {
    const findings = r3ErrorCode.staticCheck!(ctxFor("r3-error-code-bad-ts"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.message).toContain("verify against final spec");
  });

  it("does not flag a server using a named constant instead of the raw legacy code", () => {
    const findings = r3ErrorCode.staticCheck!(ctxFor("r3-error-code-clean-ts"));
    expect(findings).toHaveLength(0);
  });
});

// ─── R4 — ttlMs ───────────────────────────────────────────────────────────────

describe("R4 ttlMs — static", () => {
  it("flags a list-response builder that never sets ttlMs", () => {
    const findings = r4TtlMs.staticCheck!(ctxFor("r4-ttl-ms-bad-ts"));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
  });

  it("does not flag a list-response builder that sets ttlMs", () => {
    const findings = r4TtlMs.staticCheck!(ctxFor("r4-ttl-ms-clean-ts"));
    expect(findings).toHaveLength(0);
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
