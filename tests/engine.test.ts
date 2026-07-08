import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { runEngine } from "../src/engine.js";
import { buildStaticContext } from "../src/static/scan.js";
import type { ProbeResult } from "../src/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");

describe("engine — static + live merge", () => {
  it("keeps findings from both static and live for the same rule id", () => {
    const staticCtx = buildStaticContext(path.join(FIXTURES, "r1-sessions-bad-ts"));
    const probeResult: ProbeResult = { url: "http://fake", session: { ok: true, requiredSession: true } };

    const findings = runEngine({ staticCtx, probeResult, strict: false });
    const r1Findings = findings.filter((f) => f.ruleId === "R1");

    expect(r1Findings.some((f) => f.source === "static")).toBe(true);
    expect(r1Findings.some((f) => f.source === "live")).toBe(true);
  });

  it("does not run F-series rules when strict=false", () => {
    const staticCtx = buildStaticContext(path.join(FIXTURES, "r1-sessions-clean-ts"));
    const findings = runEngine({ staticCtx, strict: false });
    expect(findings.some((f) => f.ruleId.startsWith("F"))).toBe(false);
  });

  it("runs F-series rules when strict=true", () => {
    const staticCtx = buildStaticContext(path.join(FIXTURES, "r1-sessions-clean-ts"));
    const findings = runEngine({ staticCtx, strict: true });
    expect(findings.some((f) => f.ruleId.startsWith("F"))).toBe(true);
  });

  it("returns no findings for an empty context and no probe", () => {
    const findings = runEngine({ strict: false });
    expect(findings).toHaveLength(0);
  });
});
