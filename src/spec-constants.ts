/**
 * ALL literal strings/numbers specific to the MCP 2026-07-28 spec live here, and ONLY here.
 * No spec literal (header name, error code, field name, method name, deprecation date,
 * spec-section URL) may be hardcoded anywhere else in this codebase.
 *
 * The 2026-07-28 spec is a Release Candidate (locked 2026-05-21). Exact strings may shift
 * between RC and final. Every constant below carries:
 *   - a `// source:` comment with the URL it came from
 *   - a confidence tag: `// confirmed` (verified against a primary spec/source document) or
 *     `// rc-summarizer — verify against final` (derived from a secondary summary/builder guide
 *     and NOT independently verified against the primary source at build time)
 *
 * Updating this tool for the final 07-28 spec should be a single-file edit: this file.
 */

// ─── Spec identity ─────────────────────────────────────────────────────────

export const SPEC_DATE = "2026-07-28";
export const SPEC_STATUS = "release candidate"; // rc-summarizer — verify against final (flip to "final" once 07-28 lands)

// ─── Primary sources (for footer / specRef fallback / --json metadata) ────

export const SOURCE_RC_BLOG =
  "https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/"; // source: build-spec.md §8
export const SOURCE_ROADMAP_BLOG =
  "https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/"; // source: build-spec.md §8
export const SOURCE_CHATFOREST_GUIDE =
  "https://chatforest.com/builders-log/mcp-spec-2026-07-28-release-candidate-stateless-breaking-changes-builder-guide/"; // source: build-spec.md §8 — secondary/summarizer source

// ─── R1 — Sessions eliminated; client metadata moves to `_meta` per-request ──

// source: SOURCE_RC_BLOG (session removal is the headline stateless change) — rc-summarizer — verify against final
export const HEADER_SESSION_ID = "Mcp-Session-Id";
// source: SOURCE_CHATFOREST_GUIDE — rc-summarizer — verify against final
export const METHOD_INITIALIZE = "initialize";
export const METHOD_INITIALIZED = "initialized";
// source: SOURCE_CHATFOREST_GUIDE — rc-summarizer — verify against final
export const META_FIELD = "_meta";

// ─── R2 — New required routing headers ─────────────────────────────────────

// source: SOURCE_CHATFOREST_GUIDE — rc-summarizer — verify against final
export const HEADER_MCP_METHOD = "Mcp-Method";
export const HEADER_MCP_NAME = "Mcp-Name";

// ─── R3 — Error-code change for missing resource ───────────────────────────

// source: SOURCE_CHATFOREST_GUIDE, current MCP spec error convention — confirmed
// (-32002 "Resource not found" is a documented MCP-specific JSON-RPC error code
// in the pre-07-28 spec; this is the LEGACY value the rule flags.)
export const ERROR_CODE_RESOURCE_NOT_FOUND_LEGACY = -32002;
// source: SOURCE_CHATFOREST_GUIDE — rc-summarizer — verify against final
// (per build-spec.md §5 R3: "current reading" only, explicitly flagged as
// partly from an RC summarizer — NOT independently confirmed against a primary
// source at build time.)
export const ERROR_CODE_RESOURCE_NOT_FOUND_NEW = -32602; // JSON-RPC standard "Invalid Params"

// ─── R4 — ttlMs (and cacheScope) list-cache metadata ───────────────────────

// source: SOURCE_CHATFOREST_GUIDE — rc-summarizer — verify against final
export const FIELD_TTL_MS = "ttlMs";
// source: SOURCE_CHATFOREST_GUIDE — rc-summarizer — verify against final (mentioned as "+ cacheScope if confirmed" in build-spec.md §5 R4 — not confirmed)
export const FIELD_CACHE_SCOPE = "cacheScope";

// ─── R5 — W3C Trace Context propagation via `_meta` ────────────────────────

// source: W3C Trace Context spec (https://www.w3.org/TR/trace-context/) — confirmed (these are
// the standard W3C header/field names, independent of MCP's own RC status)
export const TRACE_FIELD_TRACEPARENT = "traceparent";
export const TRACE_FIELD_TRACESTATE = "tracestate";
export const TRACE_FIELD_BAGGAGE = "baggage";

// ─── R6 — Deprecated primitives: Roots, Sampling, Logging ──────────────────

// source: SOURCE_ROADMAP_BLOG — rc-summarizer — verify against final
export const CAPABILITY_ROOTS = "roots";
export const CAPABILITY_SAMPLING = "sampling";
export const CAPABILITY_LOGGING = "logging";
// source: SOURCE_ROADMAP_BLOG — rc-summarizer — verify against final
export const DEPRECATION_SUNSET_DATE = "2027-05"; // "~May 2027" per build-spec.md §5 R6

// ─── F-series (forward-looking, --strict only) ─────────────────────────────

// source: SOURCE_ROADMAP_BLOG — rc-summarizer — verify against final
export const METHOD_SERVER_DISCOVER = "server/discover";
export const RESULT_INPUT_REQUIRED = "InputRequiredResult";
export const JSON_SCHEMA_DIALECT_2020_12 = "https://json-schema.org/draft/2020-12/schema"; // confirmed (this is the real, stable JSON Schema 2020-12 meta-schema URI)
export const METHOD_TASKS_LIST = "tasks/list";
export const AUTH_PARAM_ISS = "iss";

// ─── Spec section references (per-rule, for Finding.specRef) ──────────────
// rc-summarizer — verify against final: anchors/paths on the RC blog post are our best guess
// at where each topic will live; the RC blog is a single long post without stable per-topic
// anchors as of build time, so every specRef below points at the top-level RC post or roadmap
// post rather than a verified deep link.

export const SPEC_REF_R1_SESSIONS = SOURCE_RC_BLOG;
export const SPEC_REF_R2_HEADERS = SOURCE_RC_BLOG;
export const SPEC_REF_R3_ERROR_CODE = SOURCE_RC_BLOG;
export const SPEC_REF_R4_TTL_MS = SOURCE_RC_BLOG;
export const SPEC_REF_R5_TRACE_CONTEXT = SOURCE_RC_BLOG;
export const SPEC_REF_R6_DEPRECATED = SOURCE_ROADMAP_BLOG;
export const SPEC_REF_F_SERIES = SOURCE_ROADMAP_BLOG;

// ─── C6 footer hook ─────────────────────────────────────────────────────────

// placeholder — Adam to confirm final contact before publish
export const CONTACT_EMAIL = "hello@workingmodel.co";
export const FOOTER_MESSAGE = `Need this done for you? Working Model runs fixed-price MCP migration sprints — ${CONTACT_EMAIL}.`;
