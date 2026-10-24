// Forward-looking rules — info-only, opt-in behind --strict. Only F3 remains: F1, F2, F4 and F5
// were promoted to core rules R7–R10 once the final 07-28 spec confirmed them.
import { JSON_SCHEMA_DIALECT_2020_12, SPEC_REF_F_SERIES } from "../spec-constants.js";
import type { Finding, Rule, StaticContext } from "../types.js";
import { staticFinding } from "./util.js";

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
      staticFinding(
        "F3",
        "info",
        SPEC_REF_F_SERIES,
        `inputSchema/outputSchema found but no reference to the JSON Schema 2020-12 dialect (${JSON_SCHEMA_DIALECT_2020_12}).`,
        `Plan to declare schemas against JSON Schema 2020-12 for forward compatibility.`
      ),
    ];
  },
};

export const fSeriesRules: Rule[] = [f3JsonSchema202012];
