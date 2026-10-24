import { HEADER_MCP_METHOD, HEADER_MCP_NAME, SPEC_REF_R2_HEADERS } from "../spec-constants.js";
import type { Finding, ProbeResult, Rule, StaticContext } from "../types.js";

const ID = "R2";
const TITLE = "Headers";

function staticCheck(ctx: StaticContext): Finding[] {
  const findings: Finding[] = [];
  if (ctx.sdk.validatesRoutingHeaders) return findings; // the SDK entry point validates them

  // Only meaningful for HTTP-transport servers — heuristic: any file mentioning an HTTP
  // server/handler pattern at all. If the project never mentions either header, flag it.
  const referencesMethodHeader = ctx.allContent.includes(HEADER_MCP_METHOD);
  const referencesNameHeader = ctx.allContent.includes(HEADER_MCP_NAME);

  const looksLikeHttpTransport =
    /streamable[-_ ]?http/i.test(ctx.allContent) ||
    /createServer|express\(|FastAPI\(|@app\.(post|route)/.test(ctx.allContent);

  if (looksLikeHttpTransport && (!referencesMethodHeader || !referencesNameHeader)) {
    findings.push({
      ruleId: ID,
      severity: "error",
      source: "static",
      message: `HTTP-transport server never validates ${HEADER_MCP_METHOD} / ${HEADER_MCP_NAME} — both become required headers in 07-28.`,
      fix: `Require and validate ${HEADER_MCP_METHOD} and ${HEADER_MCP_NAME} on every request; reject header/body mismatches; update any proxies/gateways to pass them through.`,
      specRef: SPEC_REF_R2_HEADERS,
    });
  }

  return findings;
}

function liveCheck(probe: ProbeResult): Finding[] {
  if (!probe.headers?.ok) return [];
  const findings: Finding[] = [];

  if (probe.headers.acceptedWithoutHeaders) {
    findings.push({
      ruleId: ID,
      severity: "error",
      source: "live",
      message: `Live probe: server accepted a request with no ${HEADER_MCP_METHOD} / ${HEADER_MCP_NAME} headers.`,
      fix: `Require and validate both headers; reject requests that omit them.`,
      specRef: SPEC_REF_R2_HEADERS,
    });
  }

  if (probe.headers.acceptedWithMismatch) {
    findings.push({
      ruleId: ID,
      severity: "error",
      source: "live",
      message: `Live probe: server accepted a request where ${HEADER_MCP_METHOD} did not match the JSON-RPC body method.`,
      fix: `Reject requests where ${HEADER_MCP_METHOD} / ${HEADER_MCP_NAME} disagree with the request body.`,
      specRef: SPEC_REF_R2_HEADERS,
    });
  }

  return findings;
}

export const r2Headers: Rule = {
  id: ID,
  title: TITLE,
  severity: "error",
  specRef: SPEC_REF_R2_HEADERS,
  staticCheck,
  liveCheck,
};
