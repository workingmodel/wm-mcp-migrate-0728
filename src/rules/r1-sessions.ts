import { HEADER_SESSION_ID, META_FIELD, METHOD_INITIALIZE, METHOD_INITIALIZED, SPEC_REF_R1_SESSIONS } from "../spec-constants.js";
import type { Finding, ProbeResult, Rule, StaticContext } from "../types.js";

const ID = "R1";
const TITLE = "Sessions";

function staticCheck(ctx: StaticContext): Finding[] {
  const findings: Finding[] = [];

  const usesSessionHeader = ctx.allContent.includes(HEADER_SESSION_ID);
  const hasHandshake =
    ctx.allContent.includes(METHOD_INITIALIZE) || ctx.allContent.includes(METHOD_INITIALIZED);
  const readsMeta = ctx.allContent.includes(META_FIELD);

  if (usesSessionHeader || hasHandshake) {
    findings.push({
      ruleId: ID,
      severity: "error",
      source: "static",
      message: `Server reads/writes ${HEADER_SESSION_ID} and/or runs an ${METHOD_INITIALIZE}/${METHOD_INITIALIZED} handshake — both are removed in 07-28.`,
      fix: `Move client metadata/capabilities/protocol version into per-request ${META_FIELD}; remove the handshake and any session store; switch sticky routing to round-robin.`,
      specRef: SPEC_REF_R1_SESSIONS,
    });
  }

  if (!readsMeta) {
    findings.push({
      ruleId: ID,
      severity: "error",
      source: "static",
      message: `No request handler reads client metadata from ${META_FIELD} — 07-28 moves per-request client metadata there.`,
      fix: `Read client capabilities/protocol version from ${META_FIELD} on each request instead of relying on a stored handshake.`,
      specRef: SPEC_REF_R1_SESSIONS,
    });
  }

  return findings;
}

function liveCheck(probe: ProbeResult): Finding[] {
  if (!probe.session?.ok) return [];
  if (!probe.session.requiredSession) return [];

  return [
    {
      ruleId: ID,
      severity: "error",
      source: "live",
      message: `Live probe: server required a ${HEADER_SESSION_ID} / rejected a request sent without one.`,
      fix: `Stop requiring sessions; accept requests with client metadata carried in per-request ${META_FIELD}.`,
      specRef: SPEC_REF_R1_SESSIONS,
    },
  ];
}

export const r1Sessions: Rule = {
  id: ID,
  title: TITLE,
  severity: "error",
  specRef: SPEC_REF_R1_SESSIONS,
  staticCheck,
  liveCheck,
};
