import { AUTH_PARAM_ISS, RFC_AUTH_ISSUER, SPEC_REF_R10_AUTH } from "../spec-constants.js";
import type { Finding, Rule, StaticContext } from "../types.js";
import { escapeRegExp, staticFinding } from "./util.js";

const ID = "R10";
const TITLE = "Auth iss";

function staticCheck(ctx: StaticContext): Finding[] {
  if (!/oauth|authorization/i.test(ctx.allContent)) return [];
  if (new RegExp(`["'\`]${escapeRegExp(AUTH_PARAM_ISS)}["'\`]`).test(ctx.allContent)) return [];
  // Warning, not error: authorization servers SHOULD include iss while clients MUST validate
  // a present one, and a source scan can't tell which side this project implements.
  return [
    staticFinding(
      ID,
      "warning",
      SPEC_REF_R10_AUTH,
      `Authorization code found but no "${AUTH_PARAM_ISS}" handling (${RFC_AUTH_ISSUER}) — authorization servers SHOULD include it and clients MUST validate a present one.`,
      `If this is an authorization server, include "${AUTH_PARAM_ISS}" in responses; if a client, validate it against the expected issuer.`
    ),
  ];
}

export const r10AuthIss: Rule = {
  id: ID,
  title: TITLE,
  severity: "warning",
  specRef: SPEC_REF_R10_AUTH,
  staticCheck,
};
