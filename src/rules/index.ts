import type { Rule } from "../types.js";
import { fSeriesRules } from "./f-series.js";
import { r1Sessions } from "./r1-sessions.js";
import { r2Headers } from "./r2-headers.js";
import { r3ErrorCode } from "./r3-error-code.js";
import { r4TtlMs } from "./r4-ttl-ms.js";
import { r5TraceContext } from "./r5-trace-context.js";
import { r6Deprecated } from "./r6-deprecated.js";

export const CORE_RULES: Rule[] = [r1Sessions, r2Headers, r3ErrorCode, r4TtlMs, r5TraceContext, r6Deprecated];

export const ALL_RULES: Rule[] = [...CORE_RULES, ...fSeriesRules];

export function activeRules(strict: boolean): Rule[] {
  return strict ? ALL_RULES : CORE_RULES;
}
