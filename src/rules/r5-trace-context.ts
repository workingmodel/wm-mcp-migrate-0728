import {
  META_FIELD,
  SPEC_REF_R5_TRACE_CONTEXT,
  TRACE_FIELD_BAGGAGE,
  TRACE_FIELD_TRACEPARENT,
  TRACE_FIELD_TRACESTATE,
} from "../spec-constants.js";
import type { Finding, ProbeResult, Rule, StaticContext } from "../types.js";

const ID = "R5";
const TITLE = "Trace Context";

function staticCheck(ctx: StaticContext): Finding[] {
  const handlesTraceContext =
    ctx.allContent.includes(TRACE_FIELD_TRACEPARENT) ||
    ctx.allContent.includes(TRACE_FIELD_TRACESTATE) ||
    ctx.allContent.includes(TRACE_FIELD_BAGGAGE);

  const hasTracingOrOtel = /opentelemetry|otel|tracer|span/i.test(ctx.allContent);

  if (handlesTraceContext) return [];

  if (hasTracingOrOtel) {
    return [
      {
        ruleId: ID,
        severity: "warning",
        source: "static",
        message: `Tracing/OTel usage found, but no W3C Trace Context (${TRACE_FIELD_TRACEPARENT}/${TRACE_FIELD_TRACESTATE}) fields are read or propagated via ${META_FIELD}.`,
        fix: `Read/propagate the fixed ${META_FIELD} trace keys (${TRACE_FIELD_TRACEPARENT}, ${TRACE_FIELD_TRACESTATE}, ${TRACE_FIELD_BAGGAGE}) for OTel compatibility.`,
        specRef: SPEC_REF_R5_TRACE_CONTEXT,
      },
    ];
  }

  return [
    {
      ruleId: ID,
      severity: "warning",
      source: "static",
      message: `No W3C Trace Context handling (${TRACE_FIELD_TRACEPARENT}/${TRACE_FIELD_TRACESTATE}/${TRACE_FIELD_BAGGAGE}) found anywhere in the project.`,
      fix: `Read/propagate the fixed ${META_FIELD} trace keys for OTel compatibility.`,
      specRef: SPEC_REF_R5_TRACE_CONTEXT,
    },
  ];
}

function liveCheck(probe: ProbeResult): Finding[] {
  // Best-effort per spec: propagation isn't directly observable from the client. Downgrade
  // to info if inconclusive (i.e. the probe couldn't run at all).
  if (!probe.traceContext?.ok) {
    return [
      {
        ruleId: ID,
        severity: "info",
        source: "live",
        message: `Live probe: could not determine whether the server accepts ${TRACE_FIELD_TRACEPARENT} in ${META_FIELD} (inconclusive).`,
        fix: `Verify manually that trace context in ${META_FIELD} is accepted and propagated.`,
        specRef: SPEC_REF_R5_TRACE_CONTEXT,
      },
    ];
  }

  if (probe.traceContext.accepted) return [];

  return [
    {
      ruleId: ID,
      severity: "warning",
      source: "live",
      message: `Live probe: request carrying ${TRACE_FIELD_TRACEPARENT} in ${META_FIELD} was rejected as an unknown field.`,
      fix: `Accept and propagate the fixed ${META_FIELD} trace keys instead of rejecting unrecognized ${META_FIELD} fields.`,
      specRef: SPEC_REF_R5_TRACE_CONTEXT,
    },
  ];
}

export const r5TraceContext: Rule = {
  id: ID,
  title: TITLE,
  severity: "warning",
  specRef: SPEC_REF_R5_TRACE_CONTEXT,
  staticCheck,
  liveCheck,
};
