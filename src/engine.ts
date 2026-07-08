import { activeRules } from "./rules/index.js";
import type { Finding, ProbeResult, StaticContext } from "./types.js";

/**
 * Runs every applicable rule's static and/or live check and returns the combined findings.
 * Same ruleId from static + live are both kept (grouped by rule id in the renderer), per
 * build-spec.md §4: "dedupes (same ruleId from static+live → keep both but group under the
 * rule in output)".
 */
export function runEngine(opts: {
  staticCtx?: StaticContext;
  probeResult?: ProbeResult;
  strict: boolean;
}): Finding[] {
  const findings: Finding[] = [];
  const rules = activeRules(opts.strict);

  for (const rule of rules) {
    if (opts.staticCtx && rule.staticCheck) {
      findings.push(...rule.staticCheck(opts.staticCtx));
    }
    if (opts.probeResult && rule.liveCheck) {
      findings.push(...rule.liveCheck(opts.probeResult));
    }
  }

  return findings;
}
