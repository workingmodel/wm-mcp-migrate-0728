import {
  FIELD_INPUT_REQUESTS,
  FIELD_RESULT_TYPE,
  RESULT_INPUT_REQUIRED,
  RESULT_TYPE_INPUT_REQUIRED,
  SDK_INPUT_REQUIRED_CALL,
  SDK_SERVER_INITIATED_CALLS,
  SERVER_INITIATED_METHODS,
  SPEC_REF_R8_MRTR,
} from "../spec-constants.js";
import type { Finding, Rule, StaticContext } from "../types.js";
import { escapeRegExp, staticFinding } from "./util.js";

const ID = "R8";
const TITLE = "Multi Round-Trip Requests";

function staticCheck(ctx: StaticContext): Finding[] {
  // Only servers that actually issue server-initiated requests are affected; a server that
  // never does is not flagged for merely not using InputRequiredResult.
  // Whole-token match: "roots/list" must not match inside "notifications/roots/list_changed".
  const issued = [...SERVER_INITIATED_METHODS, ...SDK_SERVER_INITIATED_CALLS].filter((m) => new RegExp(`${escapeRegExp(m)}(?![\\w/])`).test(ctx.allContent));
  if (issued.length === 0) return [];
  const usesMrtr = [RESULT_INPUT_REQUIRED, RESULT_TYPE_INPUT_REQUIRED].some((m) => ctx.allContent.includes(m)) ||
    new RegExp(`${SDK_INPUT_REQUIRED_CALL}\\(`).test(ctx.allContent);
  if (usesMrtr) return [];

  return [
    staticFinding(
      ID,
      "error",
      SPEC_REF_R8_MRTR,
      `Server sends server-initiated request(s) (${issued.join(", ")}) and never references ${RESULT_INPUT_REQUIRED} / "${RESULT_TYPE_INPUT_REQUIRED}" — 07-28 replaces these with Multi Round-Trip Requests.`,
      `Return an ${RESULT_INPUT_REQUIRED} (${FIELD_RESULT_TYPE} "${RESULT_TYPE_INPUT_REQUIRED}", ${FIELD_INPUT_REQUESTS}) and let the client retry the original request with the answers.`
    ),
  ];
}

export const r8Mrtr: Rule = {
  id: ID,
  title: TITLE,
  severity: "error",
  specRef: SPEC_REF_R8_MRTR,
  staticCheck,
};
