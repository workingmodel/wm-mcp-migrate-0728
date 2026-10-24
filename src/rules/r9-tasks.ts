import {
  EXTENSION_TASKS,
  METHOD_TASKS_GET,
  METHOD_TASKS_LIST,
  METHOD_TASKS_UPDATE,
  SPEC_REF_R9_TASKS,
} from "../spec-constants.js";
import type { Finding, Rule, StaticContext } from "../types.js";
import { staticFinding } from "./util.js";

const ID = "R9";
const TITLE = "Tasks";

function staticCheck(ctx: StaticContext): Finding[] {
  if (!ctx.allContent.includes(METHOD_TASKS_LIST)) return [];
  return [
    staticFinding(
      ID,
      "error",
      SPEC_REF_R9_TASKS,
      `${METHOD_TASKS_LIST} found — it is removed in 07-28, and Tasks move to the ${EXTENSION_TASKS} extension.`,
      `Drop ${METHOD_TASKS_LIST}; poll ${METHOD_TASKS_GET} and use ${METHOD_TASKS_UPDATE} under the ${EXTENSION_TASKS} extension.`
    ),
  ];
}

export const r9Tasks: Rule = {
  id: ID,
  title: TITLE,
  severity: "error",
  specRef: SPEC_REF_R9_TASKS,
  staticCheck,
};
