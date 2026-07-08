// Forward-looking rules — info-only, opt-in behind --strict. Cheap to include, but
// summarizer-sourced (per build-spec.md §5), so kept at info severity to avoid overclaiming.
// Per spec: "If a signal can't be checked reliably, omit the rule rather than emit a shaky
// finding" — these all use simple, reliable string-presence signals; F-series rules have no
// liveCheck because none of these signals are reliably probeable over the wire yet.
import {
  AUTH_PARAM_ISS,
  JSON_SCHEMA_DIALECT_2020_12,
  METHOD_SERVER_DISCOVER,
  METHOD_TASKS_LIST,
  RESULT_INPUT_REQUIRED,
  SPEC_REF_F_SERIES,
} from "../spec-constants.js";
import type { Finding, Rule, StaticContext } from "../types.js";

function makeInfoFinding(id: string, message: string, fix: string): Finding {
  return { ruleId: id, severity: "info", source: "static", message, fix, specRef: SPEC_REF_F_SERIES };
}

const f1HandshakeRemoval: Rule = {
  id: "F1",
  title: "Handshake Removal",
  severity: "info",
  specRef: SPEC_REF_F_SERIES,
  strict: true,
  staticCheck(ctx: StaticContext): Finding[] {
    if (ctx.allContent.includes(METHOD_SERVER_DISCOVER)) return [];
    return [
      makeInfoFinding(
        "F1",
        `No use of ${METHOD_SERVER_DISCOVER} found — roadmap direction is to replace the initialize handshake with discovery.`,
        `Track the ${METHOD_SERVER_DISCOVER} method as the roadmap-direction replacement for the handshake.`
      ),
    ];
  },
};

const f2InputRequiredResult: Rule = {
  id: "F2",
  title: "InputRequiredResult",
  severity: "info",
  specRef: SPEC_REF_F_SERIES,
  strict: true,
  staticCheck(ctx: StaticContext): Finding[] {
    if (ctx.allContent.includes(RESULT_INPUT_REQUIRED)) return [];
    return [
      makeInfoFinding(
        "F2",
        `No use of ${RESULT_INPUT_REQUIRED} found — roadmap direction favors this over SSE server→client elicitation.`,
        `Consider ${RESULT_INPUT_REQUIRED} as the forward-compatible way to request more input from the client.`
      ),
    ];
  },
};

const f3JsonSchema202012: Rule = {
  id: "F3",
  title: "JSON Schema 2020-12",
  severity: "info",
  specRef: SPEC_REF_F_SERIES,
  strict: true,
  staticCheck(ctx: StaticContext): Finding[] {
    if (ctx.allContent.includes(JSON_SCHEMA_DIALECT_2020_12)) return [];
    if (!/inputSchema|outputSchema/.test(ctx.allContent)) return [];
    return [
      makeInfoFinding(
        "F3",
        `inputSchema/outputSchema found but no reference to the JSON Schema 2020-12 dialect (${JSON_SCHEMA_DIALECT_2020_12}).`,
        `Plan to declare schemas against JSON Schema 2020-12 for forward compatibility.`
      ),
    ];
  },
};

const f4TasksExtension: Rule = {
  id: "F4",
  title: "Tasks Extension",
  severity: "info",
  specRef: SPEC_REF_F_SERIES,
  strict: true,
  staticCheck(ctx: StaticContext): Finding[] {
    if (!ctx.allContent.includes(METHOD_TASKS_LIST)) return [];
    return [
      makeInfoFinding(
        "F4",
        `${METHOD_TASKS_LIST} found — the roadmap direction is Tasks extension graduation, which may remove this method.`,
        `Track the Tasks extension graduation path; ${METHOD_TASKS_LIST} may be replaced.`
      ),
    ];
  },
};

const f5AuthIssParam: Rule = {
  id: "F5",
  title: "Authorization iss Parameter",
  severity: "info",
  specRef: SPEC_REF_F_SERIES,
  strict: true,
  staticCheck(ctx: StaticContext): Finding[] {
    const hasAuth = /oauth|authorization/i.test(ctx.allContent);
    if (!hasAuth) return [];
    if (new RegExp(`["'\`]${AUTH_PARAM_ISS}["'\`]`).test(ctx.allContent)) return [];
    return [
      makeInfoFinding(
        "F5",
        `Authorization code found but no "${AUTH_PARAM_ISS}" parameter handling — roadmap direction adds an issuer parameter.`,
        `Plan to validate the "${AUTH_PARAM_ISS}" authorization parameter for forward compatibility.`
      ),
    ];
  },
};

export const fSeriesRules: Rule[] = [
  f1HandshakeRemoval,
  f2InputRequiredResult,
  f3JsonSchema202012,
  f4TasksExtension,
  f5AuthIssParam,
];
