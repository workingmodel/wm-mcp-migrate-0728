import {
  HEADER_SESSION_ID,
  META_FIELD,
  META_PROTOCOL_VERSION,
  METHOD_INITIALIZE,
  METHOD_INITIALIZED,
  SPEC_REF_R1_SESSIONS,
} from "../spec-constants.js";
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
      message: `Server reads/writes ${HEADER_SESSION_ID} and/or runs an ${METHOD_INITIALIZE}/${METHOD_INITIALIZED} handshake — both are removed in the final 07-28 spec.`,
      fix: `Move client metadata/capabilities/protocol version into per-request ${META_FIELD}; remove the handshake and any session store; switch sticky routing to round-robin.`,
      specRef: SPEC_REF_R1_SESSIONS,
    });
  }

  // The namespaced key is the real signal: a bare `_meta` read (e.g. progressToken) doesn't
  // prove the server reads the per-request protocol version.
  // With an official SDK the envelope is the SDK's job (R13 covers SDK support).
  if (ctx.sdk.kind === "none" && !ctx.allContent.includes(META_PROTOCOL_VERSION)) {
    findings.push({
      ruleId: ID,
      severity: "error",
      source: "static",
      message: readsMeta
        ? `Server reads ${META_FIELD} but never references ${META_PROTOCOL_VERSION} — every 07-28 request carries it, and it replaces the handshake's version negotiation.`
        : `No request handler reads client metadata from ${META_FIELD} (${META_PROTOCOL_VERSION}) — 07-28 moves per-request client metadata there.`,
      fix: `Read ${META_PROTOCOL_VERSION} and the client capabilities from ${META_FIELD} on each request instead of relying on a stored handshake.`,
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
