import {
  CAPABILITY_LOGGING,
  CAPABILITY_ROOTS,
  CAPABILITY_SAMPLING,
  DEPRECATION_EARLIEST_REMOVAL,
  SPEC_REF_R6_DEPRECATED,
} from "../spec-constants.js";
import type { Finding, ProbeResult, Rule, StaticContext } from "../types.js";

const ID = "R6";
const TITLE = "Deprecated";
const DEPRECATED_CAPS = [CAPABILITY_ROOTS, CAPABILITY_SAMPLING, CAPABILITY_LOGGING];

const REPLACEMENTS: Record<string, string> = {
  [CAPABILITY_ROOTS]: "tool params/config",
  [CAPABILITY_SAMPLING]: "a direct LLM API call",
  [CAPABILITY_LOGGING]: "stderr/OTel",
};

function findingFor(cap: string, source: "static" | "live"): Finding {
  return {
    ruleId: ID,
    severity: "warning",
    source,
    message: `Server declares/uses the "${cap}" capability, deprecated as of 07-28 (eligible for removal in the first spec revision released on or after ${DEPRECATION_EARLIEST_REMOVAL}).`,
    fix: `Plan a replacement: ${cap} → ${REPLACEMENTS[cap]}. Not a blocker on its own.`,
    specRef: SPEC_REF_R6_DEPRECATED,
  };
}

function staticCheck(ctx: StaticContext): Finding[] {
  const findings: Finding[] = [];
  for (const cap of DEPRECATED_CAPS) {
    // Heuristic: capability name appearing quoted, as expected in a capability declaration
    // object (e.g. `capabilities: { roots: {...} }` or `"sampling": true`).
    const re = new RegExp(`["'\`]?${cap}["'\`]?\\s*:`, "i");
    if (re.test(ctx.allContent)) {
      findings.push(findingFor(cap, "static"));
    }
  }
  return findings;
}

function liveCheck(probe: ProbeResult): Finding[] {
  if (!probe.capabilities?.ok) return [];

  const findings: Finding[] = [];
  for (const cap of DEPRECATED_CAPS) {
    if (probe.capabilities.capabilities.includes(cap)) {
      findings.push(findingFor(cap, "live"));
    }
  }
  return findings;
}

export const r6Deprecated: Rule = {
  id: ID,
  title: TITLE,
  severity: "warning",
  specRef: SPEC_REF_R6_DEPRECATED,
  staticCheck,
  liveCheck,
};
