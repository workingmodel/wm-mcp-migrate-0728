import {
  CACHEABLE_METHODS,
  CACHE_SCOPE_PRIVATE,
  CACHE_SCOPE_PUBLIC,
  FIELD_CACHE_SCOPE,
  FIELD_TTL_MS,
  METHOD_TOOLS_LIST,
  SPEC_REF_R4_TTL_MS,
} from "../spec-constants.js";
import type { Finding, ProbeResult, Rule, StaticContext } from "../types.js";

const ID = "R4";
const TITLE = "Cache metadata";

function staticCheck(ctx: StaticContext): Finding[] {
  if (ctx.sdk.kind !== "none") return []; // SDK always emits cache fields (R13 covers it)
  const buildsCacheable = CACHEABLE_METHODS.some((m) => ctx.allContent.includes(m));
  if (!buildsCacheable) return [];

  const findings: Finding[] = [];
  const methods = CACHEABLE_METHODS.join(", ");

  // One finding per missing field.
  if (!ctx.allContent.includes(FIELD_TTL_MS)) {
    findings.push({
      ruleId: ID,
      severity: "error",
      source: "static",
      message: `Server handles list/read endpoints (${methods}) but never sets ${FIELD_TTL_MS} — it is REQUIRED on these results in 07-28 (CacheableResult).`,
      fix: `Add ${FIELD_TTL_MS} (ms) to every result of ${methods}, reflecting real cache validity.`,
      specRef: SPEC_REF_R4_TTL_MS,
    });
  }
  if (!ctx.allContent.includes(FIELD_CACHE_SCOPE)) {
    findings.push({
      ruleId: ID,
      severity: "error",
      source: "static",
      message: `Server handles list/read endpoints (${methods}) but never sets ${FIELD_CACHE_SCOPE} — it is REQUIRED on these results in 07-28 (CacheableResult).`,
      fix: `Add ${FIELD_CACHE_SCOPE} ("${CACHE_SCOPE_PUBLIC}" or "${CACHE_SCOPE_PRIVATE}") to every result of ${methods}.`,
      specRef: SPEC_REF_R4_TTL_MS,
    });
  }

  return findings;
}

function liveCheck(probe: ProbeResult): Finding[] {
  if (!probe.listCache?.ok) return [];
  const findings: Finding[] = [];

  if (!probe.listCache.hasTtlMs) {
    findings.push({
      ruleId: ID,
      severity: "error",
      source: "live",
      message: `Live probe: ${METHOD_TOOLS_LIST} result has no ${FIELD_TTL_MS} — it is REQUIRED in 07-28.`,
      fix: `Add ${FIELD_TTL_MS} (ms) to list results.`,
      specRef: SPEC_REF_R4_TTL_MS,
    });
  }
  if (!probe.listCache.hasCacheScope) {
    findings.push({
      ruleId: ID,
      severity: "error",
      source: "live",
      message: `Live probe: ${METHOD_TOOLS_LIST} result has no ${FIELD_CACHE_SCOPE} — it is REQUIRED in 07-28.`,
      fix: `Add ${FIELD_CACHE_SCOPE} ("${CACHE_SCOPE_PUBLIC}" or "${CACHE_SCOPE_PRIVATE}") to list results.`,
      specRef: SPEC_REF_R4_TTL_MS,
    });
  }

  return findings;
}

export const r4TtlMs: Rule = {
  id: ID,
  title: TITLE,
  severity: "error",
  specRef: SPEC_REF_R4_TTL_MS,
  staticCheck,
  liveCheck,
};
