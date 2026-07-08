import chalk from "chalk";
import { FOOTER_MESSAGE, SPEC_DATE, SPEC_STATUS } from "./spec-constants.js";
import type { Finding, JsonOutput } from "./types.js";

const ICONS: Record<Finding["severity"], string> = { error: "✖", warning: "⚠", info: "ℹ" };
const COLORS: Record<Finding["severity"], (s: string) => string> = {
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
};

// Rule id → human title, for the "[R1 Sessions]" style label in output.
const RULE_TITLES: Record<string, string> = {
  R1: "Sessions",
  R2: "Headers",
  R3: "Error Code",
  R4: "ttlMs",
  R5: "Trace Context",
  R6: "Deprecated",
  F1: "Handshake Removal",
  F2: "InputRequiredResult",
  F3: "JSON Schema 2020-12",
  F4: "Tasks Extension",
  F5: "Auth iss Param",
};

function label(ruleId: string): string {
  return RULE_TITLES[ruleId] ? `${ruleId} ${RULE_TITLES[ruleId]}` : ruleId;
}

export function renderHeader(opts: { staticPath: string | null; url: string | null }): void {
  console.log();
  console.log(chalk.bold("mcp-migrate-0728"));
  console.log();

  const targets: string[] = [];
  if (opts.staticPath) targets.push(`${opts.staticPath}  (static)`);
  if (opts.url) targets.push(`${opts.url}  (live)`);
  console.log(`Target: ${targets.join("  +  ")}`);
  console.log(chalk.dim(`Checking against MCP spec ${SPEC_DATE} (${SPEC_STATUS})`));
  console.log();
}

export function renderFindings(findings: Finding[]): void {
  // Group by rule id, preserving first-seen order.
  const order: string[] = [];
  const groups = new Map<string, Finding[]>();
  for (const f of findings) {
    if (!groups.has(f.ruleId)) {
      groups.set(f.ruleId, []);
      order.push(f.ruleId);
    }
    groups.get(f.ruleId)!.push(f);
  }

  for (const ruleId of order) {
    for (const f of groups.get(ruleId)!) {
      const color = COLORS[f.severity];
      const icon = ICONS[f.severity];
      console.log(color(`${icon} [${label(f.ruleId)}] ${f.message}`));
      console.log(chalk.dim(`  → ${f.fix} ${f.specRef}`));
      console.log();
    }
  }
}

export function renderSummary(findings: Finding[]): void {
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const infos = findings.filter((f) => f.severity === "info").length;

  const parts: string[] = [];
  if (errors > 0) parts.push(chalk.red(`${errors} error${errors === 1 ? "" : "s"}`));
  if (warnings > 0) parts.push(chalk.yellow(`${warnings} warning${warnings === 1 ? "" : "s"}`));
  if (infos > 0) parts.push(chalk.blue(`${infos} info${infos === 1 ? "" : "s"}`));

  if (parts.length === 0) {
    console.log(chalk.green(`Summary: clean — no breaking-change signals found for ${SPEC_DATE}.`));
    console.log();
    return;
  }

  const verdict =
    errors > 0
      ? ` — this server needs migration work before ${SPEC_DATE}.`
      : ` — no blocking issues, but review the warnings before ${SPEC_DATE}.`;
  console.log(chalk.bold("Summary: ") + parts.join(", ") + verdict);
  console.log();

  if (errors > 0) {
    console.log(chalk.dim(FOOTER_MESSAGE));
    console.log();
  }
}

export function buildJsonOutput(opts: {
  staticPath: string | null;
  url: string | null;
  findings: Finding[];
}): JsonOutput {
  const errors = opts.findings.filter((f) => f.severity === "error").length;
  const warnings = opts.findings.filter((f) => f.severity === "warning").length;
  const infos = opts.findings.filter((f) => f.severity === "info").length;

  let mode: JsonOutput["mode"] = "static";
  if (opts.staticPath && opts.url) mode = "static+live";
  else if (opts.url) mode = "live";

  return {
    target: { static: opts.staticPath, live: opts.url },
    mode,
    specDate: SPEC_DATE,
    findings: opts.findings,
    summary: { errors, warnings, infos },
  };
}

export function renderJson(output: JsonOutput): void {
  console.log(JSON.stringify(output, null, 2));
}

export function exitCode(opts: { findings: Finding[]; connectError: boolean }): number {
  if (opts.connectError) return 2;
  if (opts.findings.some((f) => f.severity === "error")) return 1;
  return 0;
}
