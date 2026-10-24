import {
  FIELD_RESULT_TYPE,
  METHOD_TOOLS_CALL,
  METHOD_TOOLS_LIST,
  RESULT_TYPE_COMPLETE,
  RESULT_TYPE_INPUT_REQUIRED,
  SPEC_REF_R12_RESULT_TYPE,
} from "../spec-constants.js";
import type { Finding, Rule, StaticContext } from "../types.js";
import { staticFinding } from "./util.js";

const ID = "R12";
const TITLE = "Result type";

function staticCheck(ctx: StaticContext): Finding[] {
  // Heuristic: a project that handles tools/call or tools/list builds JSON-RPC results.
  const buildsResults = ctx.allContent.includes(METHOD_TOOLS_CALL) || ctx.allContent.includes(METHOD_TOOLS_LIST);
  if (!buildsResults) return [];
  if (ctx.allContent.includes(FIELD_RESULT_TYPE)) return [];
  return [
    staticFinding(
      ID,
      "error",
      SPEC_REF_R12_RESULT_TYPE,
      `Server builds JSON-RPC results but never references ${FIELD_RESULT_TYPE} — it is REQUIRED on every result in 07-28.`,
      `Set ${FIELD_RESULT_TYPE} ("${RESULT_TYPE_COMPLETE}" or "${RESULT_TYPE_INPUT_REQUIRED}") on every result.`
    ),
  ];
}

export const r12ResultType: Rule = {
  id: ID,
  title: TITLE,
  severity: "error",
  specRef: SPEC_REF_R12_RESULT_TYPE,
  staticCheck,
};
