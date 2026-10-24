export type Severity = "error" | "warning" | "info";

export interface Finding {
  ruleId: string; // "R1"…"R12" (+ "F3" for the forward-looking --strict rule)
  severity: Severity;
  source: "static" | "live";
  message: string; // what's wrong / at risk
  fix: string; // → remediation, one actionable sentence
  specRef: string;
}

export interface Rule {
  id: string; // "R1"…"R12" (+ "F3" for the forward-looking --strict rule)
  title: string;
  severity: Severity; // default severity; a check may downgrade/upgrade
  specRef: string; // URL from spec-constants
  strict?: boolean; // forward-looking (F-series) rule — only runs with --strict
  staticCheck?(ctx: StaticContext): Finding[];
  liveCheck?(probe: ProbeResult): Finding[];
}

// ─── Static analysis ──────────────────────────────────────────────────────

export interface SourceFile {
  path: string; // relative to scan root
  content: string;
  lang: "ts" | "py" | "other";
}

export interface StaticContext {
  root: string;
  files: SourceFile[];
  // convenience: concatenation of all file contents, for cheap whole-project greps
  allContent: string;
}

// ─── Live probe ───────────────────────────────────────────────────────────

export interface ProbeCheck {
  ok: boolean; // true if the check ran (regardless of pass/fail verdict)
  error?: string; // transport-level error, if the check itself couldn't be performed
}

export interface SessionProbe extends ProbeCheck {
  requiredSession: boolean; // server rejected/required a session id when none was sent
}

export interface HeadersProbe extends ProbeCheck {
  acceptedWithoutHeaders: boolean; // request with no routing headers succeeded
  acceptedWithMismatch: boolean; // request with mismatched routing header vs body succeeded
}

export interface ErrorCodeProbe extends ProbeCheck {
  code?: number; // JSON-RPC error code returned for a missing-resource request
}

export interface ListCacheProbe extends ProbeCheck {
  hasTtlMs: boolean;
  hasCacheScope: boolean;
}

export interface TraceContextProbe extends ProbeCheck {
  accepted: boolean; // request carrying traceparent in _meta was not rejected
}

export interface CapabilitiesProbe extends ProbeCheck {
  capabilities: string[]; // advertised capability names
}

export interface ProbeResult {
  url: string;
  connectError?: string; // set when the live probe could not connect at all
  session?: SessionProbe;
  headers?: HeadersProbe;
  errorCode?: ErrorCodeProbe;
  listCache?: ListCacheProbe;
  traceContext?: TraceContextProbe;
  capabilities?: CapabilitiesProbe;
}

// ─── CLI / rendering ──────────────────────────────────────────────────────

export interface RunOptions {
  path?: string;
  url?: string;
  json: boolean;
  strict: boolean;
}

export interface JsonOutput {
  target: {
    static: string | null;
    live: string | null;
  };
  mode: "static" | "live" | "static+live";
  specDate: string;
  findings: Finding[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}
