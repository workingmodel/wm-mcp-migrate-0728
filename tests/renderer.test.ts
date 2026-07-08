import { describe, expect, it } from "vitest";
import { buildJsonOutput, exitCode } from "../src/renderer.js";
import type { Finding } from "../src/types.js";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    ruleId: "R1",
    severity: "error",
    source: "static",
    message: "msg",
    fix: "fix",
    specRef: "https://example.com",
    ...overrides,
  };
}

describe("exitCode", () => {
  it("returns 2 when the live probe could not connect, regardless of findings", () => {
    expect(exitCode({ findings: [], connectError: true })).toBe(2);
    expect(exitCode({ findings: [finding()], connectError: true })).toBe(2);
  });

  it("returns 1 when there is at least one error finding", () => {
    expect(exitCode({ findings: [finding({ severity: "error" })], connectError: false })).toBe(1);
  });

  it("returns 0 when there are only warnings/infos", () => {
    expect(
      exitCode({
        findings: [finding({ severity: "warning" }), finding({ severity: "info" })],
        connectError: false,
      })
    ).toBe(0);
  });

  it("returns 0 when there are no findings at all", () => {
    expect(exitCode({ findings: [], connectError: false })).toBe(0);
  });
});

describe("buildJsonOutput", () => {
  it("reports mode 'static' when only a static path is given", () => {
    const output = buildJsonOutput({ staticPath: "/some/path", url: null, findings: [] });
    expect(output.mode).toBe("static");
  });

  it("reports mode 'live' when only a url is given", () => {
    const output = buildJsonOutput({ staticPath: null, url: "http://example.com", findings: [] });
    expect(output.mode).toBe("live");
  });

  it("reports mode 'static+live' when both are given", () => {
    const output = buildJsonOutput({ staticPath: "/some/path", url: "http://example.com", findings: [] });
    expect(output.mode).toBe("static+live");
  });

  it("summarizes error/warning/info counts correctly", () => {
    const output = buildJsonOutput({
      staticPath: "/some/path",
      url: null,
      findings: [
        finding({ severity: "error" }),
        finding({ severity: "error" }),
        finding({ severity: "warning" }),
        finding({ severity: "info" }),
      ],
    });
    expect(output.summary).toEqual({ errors: 2, warnings: 1, infos: 1 });
  });

  it("includes the specDate and full findings array", () => {
    const f = finding();
    const output = buildJsonOutput({ staticPath: "/some/path", url: null, findings: [f] });
    expect(output.specDate).toBe("2026-07-28");
    expect(output.findings).toEqual([f]);
  });
});
