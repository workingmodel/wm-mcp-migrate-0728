import {
  ERROR_CODE_RESOURCE_NOT_FOUND_LEGACY,
  ERROR_CODE_RESOURCE_NOT_FOUND_NEW,
  SPEC_REF_R3_ERROR_CODE,
} from "../spec-constants.js";
import type { Finding, ProbeResult, Rule, StaticContext } from "../types.js";

const ID = "R3";
const TITLE = "Error Code";
const SEVERITY = "error";

function staticCheck(ctx: StaticContext): Finding[] {
  const legacy = String(ERROR_CODE_RESOURCE_NOT_FOUND_LEGACY);
  if (!ctx.allContent.includes(legacy)) return [];

  return [
    {
      ruleId: ID,
      severity: SEVERITY,
      source: "static",
      message: `Found hardcoded legacy error code ${legacy} in source, likely used for missing-resource responses — 07-28 changes it to ${ERROR_CODE_RESOURCE_NOT_FOUND_NEW}.`,
      fix: `Replace hardcoded numeric error-code checks with named constants and return ${ERROR_CODE_RESOURCE_NOT_FOUND_NEW} for missing resources.`,
      specRef: SPEC_REF_R3_ERROR_CODE,
    },
  ];
}

function liveCheck(probe: ProbeResult): Finding[] {
  if (!probe.errorCode?.ok || probe.errorCode.code === undefined) return [];

  const code = probe.errorCode.code;
  if (code === ERROR_CODE_RESOURCE_NOT_FOUND_NEW) return [];

  if (code === ERROR_CODE_RESOURCE_NOT_FOUND_LEGACY) {
    return [
      {
        ruleId: ID,
        severity: SEVERITY,
        source: "live",
        message: `Live probe: missing-resource request returned legacy error code ${code} — the expected 07-28 code is ${ERROR_CODE_RESOURCE_NOT_FOUND_NEW}.`,
        fix: `Return ${ERROR_CODE_RESOURCE_NOT_FOUND_NEW} for missing resources.`,
        specRef: SPEC_REF_R3_ERROR_CODE,
      },
    ];
  }

  // Some other code entirely — still worth flagging, but softer message.
  return [
    {
      ruleId: ID,
      severity: SEVERITY,
      source: "live",
      message: `Live probe: missing-resource request returned error code ${code}, which matches neither the legacy (${ERROR_CODE_RESOURCE_NOT_FOUND_LEGACY}) nor expected new (${ERROR_CODE_RESOURCE_NOT_FOUND_NEW}) code.`,
      fix: `Return ${ERROR_CODE_RESOURCE_NOT_FOUND_NEW} for missing resources, per the final spec.`,
      specRef: SPEC_REF_R3_ERROR_CODE,
    },
  ];
}

export const r3ErrorCode: Rule = {
  id: ID,
  title: TITLE,
  severity: SEVERITY,
  specRef: SPEC_REF_R3_ERROR_CODE,
  staticCheck,
  liveCheck,
};
