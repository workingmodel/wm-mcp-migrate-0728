import { FIELD_TTL_MS, SPEC_REF_R4_TTL_MS } from "../spec-constants.js";
import type { Finding, ProbeResult, Rule, StaticContext } from "../types.js";

const ID = "R4";
const TITLE = "ttlMs";

function staticCheck(ctx: StaticContext): Finding[] {
  const buildsList = /tools\/list|resources\/list/.test(ctx.allContent);
  if (!buildsList) return [];
  if (ctx.allContent.includes(FIELD_TTL_MS)) return [];

  return [
    {
      ruleId: ID,
      severity: "warning",
      source: "static",
      message: `Server builds tools/list or resources/list responses but never sets ${FIELD_TTL_MS} — clients can't cache your list responses.`,
      fix: `Add ${FIELD_TTL_MS} (ms) to list responses reflecting real cache validity; omit only if you intend to keep legacy refetch behavior.`,
      specRef: SPEC_REF_R4_TTL_MS,
    },
  ];
}

function liveCheck(probe: ProbeResult): Finding[] {
  if (!probe.listCache?.ok) return [];
  if (probe.listCache.hasTtlMs) return [];

  return [
    {
      ruleId: ID,
      severity: "warning",
      source: "live",
      message: `Live probe: tools/list response has no ${FIELD_TTL_MS} — clients can't cache your tool list.`,
      fix: `Add ${FIELD_TTL_MS} (ms) to list responses. Optional, but recommended before 07-28.`,
      specRef: SPEC_REF_R4_TTL_MS,
    },
  ];
}

export const r4TtlMs: Rule = {
  id: ID,
  title: TITLE,
  severity: "warning",
  specRef: SPEC_REF_R4_TTL_MS,
  staticCheck,
  liveCheck,
};
