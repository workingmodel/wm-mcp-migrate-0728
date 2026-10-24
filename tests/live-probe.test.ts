import { afterEach, describe, expect, it } from "vitest";
import { probe } from "../src/live/probe.js";
import { FULLY_OLD_SPEC_OPTIONS, startMockServer } from "./mock-server.js";

let cleanup: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (cleanup) {
    await cleanup();
    cleanup = null;
  }
});

describe("live probe — connection", () => {
  it("returns a connectError when the server is unreachable", async () => {
    const result = await probe("http://127.0.0.1:1/mcp"); // nothing listens on port 1
    expect(result.connectError).toBeDefined();
  });
});

describe("live probe — R1 sessions", () => {
  it("flags requiredSession=true for an old-spec server that demands Mcp-Session-Id", async () => {
    const mock = await startMockServer({ requireSession: true });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.session?.requiredSession).toBe(true);
  });

  it("flags requiredSession=false for a new-spec server with no session requirement", async () => {
    const mock = await startMockServer({});
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.session?.requiredSession).toBe(false);
  });
});

describe("live probe — R2 headers", () => {
  it("flags acceptedWithoutHeaders=true for an old-spec server with no header enforcement", async () => {
    const mock = await startMockServer({});
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.headers?.acceptedWithoutHeaders).toBe(true);
  });

  it("flags acceptedWithoutHeaders=false and acceptedWithMismatch=false for a compliant server", async () => {
    const mock = await startMockServer({ enforceRoutingHeaders: true });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.headers?.acceptedWithoutHeaders).toBe(false);
    expect(result.headers?.acceptedWithMismatch).toBe(false);
  });
});

describe("live probe — R3 error code", () => {
  it("captures the legacy -32002 code from a non-migrated server", async () => {
    const mock = await startMockServer({ resourceErrorCode: -32002 });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.errorCode?.code).toBe(-32002);
  });

  it("captures the new -32602 code from a migrated server", async () => {
    const mock = await startMockServer({ resourceErrorCode: -32602 });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.errorCode?.code).toBe(-32602);
  });
});

describe("live probe — R4 cache metadata", () => {
  it("detects cacheScope present / absent on tools/list", async () => {
    const withScope = await startMockServer({ includeCacheScope: true });
    const r1 = await probe(withScope.url);
    await withScope.close();
    expect(r1.listCache?.hasCacheScope).toBe(true);

    const without = await startMockServer({ includeCacheScope: false });
    cleanup = without.close;
    const r2 = await probe(without.url);
    expect(r2.listCache?.hasCacheScope).toBe(false);
  });

  it("detects ttlMs present on tools/list", async () => {
    const mock = await startMockServer({ includeTtlMs: true });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.listCache?.hasTtlMs).toBe(true);
  });

  it("detects ttlMs absent on tools/list", async () => {
    const mock = await startMockServer({ includeTtlMs: false });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.listCache?.hasTtlMs).toBe(false);
  });
});

describe("live probe — R5 trace context", () => {
  it("marks accepted=true when the server does not reject traceparent in _meta", async () => {
    const mock = await startMockServer({ rejectTraceContext: false });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.traceContext?.accepted).toBe(true);
  });

  it("marks accepted=false when the server rejects traceparent in _meta", async () => {
    const mock = await startMockServer({ rejectTraceContext: true });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.traceContext?.accepted).toBe(false);
  });
});

describe("live probe — R6 capabilities", () => {
  it("captures advertised deprecated capabilities", async () => {
    const mock = await startMockServer({ capabilities: ["roots", "sampling", "tools"] });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.capabilities?.capabilities).toEqual(expect.arrayContaining(["roots", "sampling", "tools"]));
  });

  it("captures an empty capability list when none are advertised", async () => {
    const mock = await startMockServer({ capabilities: [] });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.capabilities?.capabilities).toEqual([]);
  });
});

describe("live probe — R6 server/discover vs initialize fallback", () => {
  it("reads capabilities from server/discover and never calls initialize when discover works", async () => {
    const mock = await startMockServer({ capabilities: ["sampling"] });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.capabilities?.capabilities).toEqual(["sampling"]);
    expect(mock.methods).toContain("server/discover");
    expect(mock.methods).not.toContain("initialize");
  });

  it("falls back to initialize when server/discover is not implemented", async () => {
    const mock = await startMockServer({ disableDiscover: true, capabilities: ["logging"] });
    cleanup = mock.close;
    const result = await probe(mock.url);
    expect(result.capabilities?.capabilities).toEqual(["logging"]);
    expect(mock.methods).toContain("server/discover");
    expect(mock.methods).toContain("initialize");
  });
});

describe("live probe — session gate does not mask other findings", () => {
  it("still surfaces R2-R6 signals against a server that requires a session on every request", async () => {
    // Regression test: a server that requires Mcp-Session-Id on every request must not
    // cause the R2-R6 probes to silently no-op just because they omit a session header.
    const mock = await startMockServer(FULLY_OLD_SPEC_OPTIONS);
    cleanup = mock.close;
    const result = await probe(mock.url);

    expect(result.session?.requiredSession).toBe(true);
    expect(result.headers?.acceptedWithoutHeaders).toBe(true);
    expect(result.errorCode?.code).toBe(-32002);
    expect(result.listCache?.hasTtlMs).toBe(false);
    expect(result.listCache?.hasCacheScope).toBe(false);
    expect(result.capabilities?.capabilities).toEqual(
      expect.arrayContaining(["roots", "sampling", "logging"])
    );
  });
});
