import {
  HEADER_LAST_EVENT_ID,
  META_LOG_LEVEL,
  METHOD_ELICITATION_COMPLETE,
  METHOD_LOGGING_SET_LEVEL,
  METHOD_PING,
  METHOD_RESOURCES_SUBSCRIBE,
  METHOD_RESOURCES_UNSUBSCRIBE,
  METHOD_ROOTS_LIST_CHANGED,
  METHOD_SUBSCRIPTIONS_LISTEN,
  RESULT_INPUT_REQUIRED,
  SPEC_REF_R11_REMOVED,
} from "../spec-constants.js";
import type { Finding, Rule, StaticContext } from "../types.js";
import { escapeRegExp, staticFinding } from "./util.js";

const ID = "R11";
const TITLE = "Removed methods";

interface Removed {
  literal: string;
  fix: string;
  // true = match case-insensitively (HTTP headers are commonly lower-cased in Node/Python)
  ci?: boolean;
}

const REMOVED: Removed[] = [
  { literal: METHOD_LOGGING_SET_LEVEL, fix: `Send the log level per request in _meta (${META_LOG_LEVEL}) instead.` },
  {
    literal: METHOD_ROOTS_LIST_CHANGED,
    fix: `Drop the notification; roots are requested on demand via an ${RESULT_INPUT_REQUIRED} (Multi Round-Trip Requests), and Roots itself is deprecated.`,
  },
  {
    literal: METHOD_RESOURCES_SUBSCRIBE,
    fix: `Use ${METHOD_SUBSCRIPTIONS_LISTEN} instead of per-resource subscribe and the HTTP GET endpoint.`,
  },
  {
    literal: METHOD_RESOURCES_UNSUBSCRIBE,
    fix: `Use ${METHOD_SUBSCRIPTIONS_LISTEN} instead of per-resource unsubscribe and the HTTP GET endpoint.`,
  },
  {
    literal: METHOD_ELICITATION_COMPLETE,
    fix: `Drop the notification and elicitationId; complete elicitation through Multi Round-Trip Requests (the client retries the original request with its answers).`,
  },
  {
    literal: HEADER_LAST_EVENT_ID,
    ci: true,
    fix: `SSE resumability is removed (no ${HEADER_LAST_EVENT_ID}, no SSE event IDs); have the client re-issue the request instead.`,
  },
];

// "ping" is a common English word and identifier, so require a quoted "ping" on a line that
// also looks like JSON-RPC method dispatch.
const PING_QUOTED = new RegExp(`["'\`]${escapeRegExp(METHOD_PING)}["'\`]`);
const METHOD_CONTEXT = /method|case\s|handler|\.on\(|route|dispatch|register/i;

function usesPingMethod(ctx: StaticContext): boolean {
  return ctx.allContent.split("\n").some((line) => PING_QUOTED.test(line) && METHOD_CONTEXT.test(line));
}

function staticCheck(ctx: StaticContext): Finding[] {
  const findings: Finding[] = [];

  if (usesPingMethod(ctx)) {
    findings.push(
      staticFinding(
        ID,
        "error",
        SPEC_REF_R11_REMOVED,
        `JSON-RPC method "${METHOD_PING}" found — removed in 07-28.`,
        `Remove the ${METHOD_PING} handler/caller; there is no replacement method, so use a normal lightweight request for liveness.`
      )
    );
  }

  for (const r of REMOVED) {
    const found = r.ci
      ? new RegExp(escapeRegExp(r.literal), "i").test(ctx.allContent)
      : ctx.allContent.includes(r.literal);
    if (!found) continue;
    findings.push(
      staticFinding(ID, "error", SPEC_REF_R11_REMOVED, `${r.literal} found — removed in 07-28.`, r.fix)
    );
  }

  return findings;
}

export const r11Removed: Rule = {
  id: ID,
  title: TITLE,
  severity: "error",
  specRef: SPEC_REF_R11_REMOVED,
  staticCheck,
};
