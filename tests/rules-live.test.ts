import { describe, expect, it } from "vitest";
import { r1Sessions } from "../src/rules/r1-sessions.js";
import { r2Headers } from "../src/rules/r2-headers.js";
import { r3ErrorCode } from "../src/rules/r3-error-code.js";
import { r4TtlMs } from "../src/rules/r4-ttl-ms.js";
import type { ProbeResult } from "../src/types.js";

function baseProbe(overrides: Partial<ProbeResult> = {}): ProbeResult {
  return { url: "http://fake", ...overrides };
}

describe("R1 sessions — live", () => {
  it("flags an error when the server required a session", () => {
    const findings = r1Sessions.liveCheck!(baseProbe({ session: { ok: true, requiredSession: true } }));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.source).toBe("live");
  });

  it("emits nothing when the server does not require a session", () => {
    const findings = r1Sessions.liveCheck!(baseProbe({ session: { ok: true, requiredSession: false } }));
    expect(findings).toHaveLength(0);
  });
});

describe("R2 headers — live", () => {
  it("flags both signals when a server accepts missing and mismatched headers", () => {
    const findings = r2Headers.liveCheck!(
      baseProbe({ headers: { ok: true, acceptedWithoutHeaders: true, acceptedWithMismatch: true } })
    );
    expect(findings).toHaveLength(2);
  });

  it("emits nothing for a compliant server", () => {
    const findings = r2Headers.liveCheck!(
      baseProbe({ headers: { ok: true, acceptedWithoutHeaders: false, acceptedWithMismatch: false } })
    );
    expect(findings).toHaveLength(0);
  });
});

describe("R3 error code — live", () => {
  it("emits nothing when the new code is returned", () => {
    const findings = r3ErrorCode.liveCheck!(baseProbe({ errorCode: { ok: true, code: -32602 } }));
    expect(findings).toHaveLength(0);
  });

  it("flags an error when the legacy code is returned", () => {
    const findings = r3ErrorCode.liveCheck!(baseProbe({ errorCode: { ok: true, code: -32002 } }));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).not.toMatch(/verify against|once confirmed/i);
  });

  it("flags an error for an unrelated code", () => {
    const findings = r3ErrorCode.liveCheck!(baseProbe({ errorCode: { ok: true, code: -32000 } }));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
  });
});

describe("R4 cache metadata — live", () => {
  it("flags an error for each of ttlMs and cacheScope when absent", () => {
    const findings = r4TtlMs.liveCheck!(baseProbe({ listCache: { ok: true, hasTtlMs: false, hasCacheScope: false } }));
    expect(findings).toHaveLength(2);
    expect(findings.every((f) => f.severity === "error")).toBe(true);
    expect(findings.every((f) => f.message.includes("REQUIRED"))).toBe(true);
  });

  it("flags only cacheScope when ttlMs is present", () => {
    const findings = r4TtlMs.liveCheck!(baseProbe({ listCache: { ok: true, hasTtlMs: true, hasCacheScope: false } }));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain("cacheScope");
  });

  it("emits nothing when both are present", () => {
    const findings = r4TtlMs.liveCheck!(baseProbe({ listCache: { ok: true, hasTtlMs: true, hasCacheScope: true } }));
    expect(findings).toHaveLength(0);
  });
});
