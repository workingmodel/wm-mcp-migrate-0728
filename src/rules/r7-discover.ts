import { METHOD_SERVER_DISCOVER, SPEC_REF_R7_DISCOVER } from "../spec-constants.js";
import type { Finding, Rule, StaticContext } from "../types.js";
import { looksLikeMcpServer, staticFinding } from "./util.js";

const ID = "R7";
const TITLE = "Discovery";

function staticCheck(ctx: StaticContext): Finding[] {
  if (ctx.sdk.kind !== "none") return []; // SDK serves discovery (R13 covers it)
  if (!looksLikeMcpServer(ctx)) return [];
  if (ctx.allContent.includes(METHOD_SERVER_DISCOVER)) return [];
  return [
    staticFinding(
      ID,
      "error",
      SPEC_REF_R7_DISCOVER,
      `No handler for ${METHOD_SERVER_DISCOVER} found — servers MUST implement it in 07-28 (it replaces the initialize handshake).`,
      `Implement ${METHOD_SERVER_DISCOVER} returning supported protocol versions, capabilities, and server identity.`
    ),
  ];
}

export const r7Discover: Rule = {
  id: ID,
  title: TITLE,
  severity: "error",
  specRef: SPEC_REF_R7_DISCOVER,
  staticCheck,
};
