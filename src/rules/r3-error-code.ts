import {
  ERROR_CODE_RESOURCE_NOT_FOUND_LEGACY,
  ERROR_CODE_RESOURCE_NOT_FOUND_NEW,
  SPEC_REF_R3_ERROR_CODE,
} from "../spec-constants.js";
import type { Finding, ProbeResult, Rule, StaticContext } from "../types.js";

const ID = "R3";
const TITLE = "Error Code";
// build-spec.md §5 R3: "Verify the exact old→new codes against the final spec — this came
// partly from an RC summarizer. If unconfirmed at build time, keep the rule but mark severity
// `warning`." The new-code literal is not independently confirmed against a primary source —
// downgraded per that instruction.
const SEVERITY = "warning";
const UNCONFIRMED_SUFFIX = "verify against final spec";

function staticCheck(ctx: StaticContext): Finding[] {
  const legacy = String(ERROR_CODE_RESOURCE_NOT_FOUND_LEGACY);
  if (!ctx.allContent.includes(legacy)) return [];

  return [
    {
      ruleId: ID,
      severity: SEVERITY,
      source: "static",
      message: `Found hardcoded legacy error code ${legacy} in source, likely used for missing-resource responses — the code changes in 07-28 (${UNCONFIRMED_SUFFIX}).`,
      fix: `Replace hardcoded numeric error-code checks with named constants and update to the new missing-resource code once confirmed.`,
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
        message: `Live probe: missing-resource request returned legacy error code ${code} — the expected 07-28 code is ${ERROR_CODE_RESOURCE_NOT_FOUND_NEW} (${UNCONFIRMED_SUFFIX}).`,
        fix: `Return the new standard error code for missing resources once confirmed against the final spec.`,
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
      message: `Live probe: missing-resource request returned error code ${code}, which matches neither the legacy (${ERROR_CODE_RESOURCE_NOT_FOUND_LEGACY}) nor expected new (${ERROR_CODE_RESOURCE_NOT_FOUND_NEW}) code (${UNCONFIRMED_SUFFIX}).`,
      fix: `Confirm the correct missing-resource error code against the final spec and align the server's response.`,
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
