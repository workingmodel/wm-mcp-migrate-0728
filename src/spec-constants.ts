/**
 * ALL literal strings/numbers specific to the MCP 2026-07-28 spec live here, and ONLY here.
 * No spec literal (header name, error code, field name, method name, deprecation date,
 * spec-section URL) may be hardcoded anywhere else in this codebase.
 *
 * Checked against the FINAL 2026-07-28 spec (v1.1.0). Every constant below carries:
 *   - a `// source:` comment with the URL it came from
 *   - a confidence tag: `// confirmed` (verified against the primary spec/changelog) or
 *     `// heuristic` (a tool-side convention, not a spec literal)
 *
 * Updating this tool for a future spec revision should be a single-file edit: this file.
 */

// ─── Spec identity ─────────────────────────────────────────────────────────

export const SPEC_DATE = "2026-07-28";
export const SPEC_STATUS = "final"; // source: SOURCE_FINAL_CHANGELOG — confirmed

// ─── Primary sources (for footer / specRef fallback / --json metadata) ────

const SPEC_BASE = "https://modelcontextprotocol.io/specification/2026-07-28";
export const SOURCE_FINAL_CHANGELOG = `${SPEC_BASE}/changelog`; // source: final spec changelog — confirmed
export const SOURCE_DEPRECATED_REGISTRY = `${SPEC_BASE}/deprecated`; // source: final spec deprecated registry — confirmed

// ─── R1 — Sessions eliminated; client metadata moves to `_meta` per-request ──

// source: SOURCE_FINAL_CHANGELOG (Mcp-Session-Id and protocol sessions removed) — confirmed
export const HEADER_SESSION_ID = "Mcp-Session-Id";
// source: SOURCE_FINAL_CHANGELOG (initialize / notifications/initialized handshake removed) — confirmed
export const METHOD_INITIALIZE = "initialize";
export const METHOD_INITIALIZED = "notifications/initialized";
// source: SOURCE_FINAL_CHANGELOG — confirmed
export const META_FIELD = "_meta";
// source: SOURCE_FINAL_CHANGELOG (legacy initialize params field name, used only by the fallback probe) — confirmed
export const FIELD_PROTOCOL_VERSION = "protocolVersion";
// source: SOURCE_FINAL_CHANGELOG (every request carries these `_meta` keys) — confirmed
export const META_PROTOCOL_VERSION = "io.modelcontextprotocol/protocolVersion";
export const META_CLIENT_CAPABILITIES = "io.modelcontextprotocol/clientCapabilities";
// source: SOURCE_FINAL_CHANGELOG (clientInfo SHOULD be sent; serverInfo SHOULD be on results) — confirmed
export const META_CLIENT_INFO = "io.modelcontextprotocol/clientInfo";
export const META_SERVER_INFO = "io.modelcontextprotocol/serverInfo";
// source: SOURCE_FINAL_CHANGELOG (per-request log level replaces logging/setLevel) — confirmed
export const META_LOG_LEVEL = "io.modelcontextprotocol/logLevel";

// ─── R2 — Required routing headers ─────────────────────────────────────────

// source: SOURCE_FINAL_CHANGELOG (required on Streamable HTTP POST requests) — confirmed
export const HEADER_MCP_METHOD = "Mcp-Method";
export const HEADER_MCP_NAME = "Mcp-Name";

// ─── R3 — Error-code change for missing resource ───────────────────────────

// source: SOURCE_FINAL_CHANGELOG (resource-not-found changed from -32002 to -32602) — confirmed
export const ERROR_CODE_RESOURCE_NOT_FOUND_LEGACY = -32002;
export const ERROR_CODE_RESOURCE_NOT_FOUND_NEW = -32602; // JSON-RPC standard "Invalid Params"

// ─── R4 — Cache metadata (CacheableResult: ttlMs + cacheScope REQUIRED) ────

// source: SOURCE_FINAL_CHANGELOG — confirmed
export const FIELD_TTL_MS = "ttlMs";
export const FIELD_CACHE_SCOPE = "cacheScope";
export const CACHE_SCOPE_PUBLIC = "public"; // source: SOURCE_FINAL_CHANGELOG — confirmed
export const CACHE_SCOPE_PRIVATE = "private"; // source: SOURCE_FINAL_CHANGELOG — confirmed
// source: SOURCE_FINAL_CHANGELOG (CacheableResult applies to exactly these five methods) — confirmed
export const METHOD_TOOLS_LIST = "tools/list";
export const METHOD_PROMPTS_LIST = "prompts/list";
export const METHOD_RESOURCES_LIST = "resources/list";
export const METHOD_RESOURCES_READ = "resources/read";
export const METHOD_RESOURCES_TEMPLATES_LIST = "resources/templates/list";
export const CACHEABLE_METHODS = [
  METHOD_TOOLS_LIST,
  METHOD_PROMPTS_LIST,
  METHOD_RESOURCES_LIST,
  METHOD_RESOURCES_READ,
  METHOD_RESOURCES_TEMPLATES_LIST,
];

// ─── R5 — W3C Trace Context propagation via `_meta` ────────────────────────

// source: SOURCE_FINAL_CHANGELOG (SEP-414 documents these `_meta` keys); W3C Trace Context
// (https://www.w3.org/TR/trace-context/) — confirmed
export const TRACE_FIELD_TRACEPARENT = "traceparent";
export const TRACE_FIELD_TRACESTATE = "tracestate";
export const TRACE_FIELD_BAGGAGE = "baggage";

// ─── R6 — Deprecated primitives: Roots, Sampling, Logging ──────────────────

// source: SOURCE_DEPRECATED_REGISTRY — confirmed
export const CAPABILITY_ROOTS = "roots";
export const CAPABILITY_SAMPLING = "sampling";
export const CAPABILITY_LOGGING = "logging";
// source: SOURCE_DEPRECATED_REGISTRY (earliest removal: first revision released on or after this date) — confirmed
export const DEPRECATION_EARLIEST_REMOVAL = "2027-07-28";

// ─── R7 — server/discover ──────────────────────────────────────────────────

// source: SOURCE_FINAL_CHANGELOG (servers MUST implement it) — confirmed
export const METHOD_SERVER_DISCOVER = "server/discover";

// ─── R8 — Multi Round-Trip Requests (MRTR) ─────────────────────────────────

// source: SPEC_REF_R8_MRTR — confirmed
export const RESULT_INPUT_REQUIRED = "InputRequiredResult";
export const RESULT_TYPE_INPUT_REQUIRED = "input_required";
export const FIELD_INPUT_REQUESTS = "inputRequests";
// source: SOURCE_FINAL_CHANGELOG (server-initiated requests replaced by InputRequiredResult) — confirmed
export const METHOD_SAMPLING_CREATE_MESSAGE = "sampling/createMessage";
export const METHOD_ELICITATION_CREATE = "elicitation/create";
export const METHOD_ROOTS_LIST = "roots/list";
export const SERVER_INITIATED_METHODS = [
  METHOD_SAMPLING_CREATE_MESSAGE,
  METHOD_ELICITATION_CREATE,
  METHOD_ROOTS_LIST,
];

// ─── R9 — Tasks moved to an extension ──────────────────────────────────────

// source: SOURCE_FINAL_CHANGELOG (tasks/list REMOVED; tasks/result replaced by polling) — confirmed
export const METHOD_TASKS_LIST = "tasks/list";
export const METHOD_TASKS_GET = "tasks/get";
export const METHOD_TASKS_UPDATE = "tasks/update";
export const EXTENSION_TASKS = "io.modelcontextprotocol/tasks"; // source: SOURCE_FINAL_CHANGELOG — confirmed

// ─── R10 — Authorization `iss` (RFC 9207) ──────────────────────────────────

// source: SPEC_REF_R10_AUTH (servers SHOULD include `iss`; clients MUST validate a present `iss`) — confirmed
export const AUTH_PARAM_ISS = "iss";
export const RFC_AUTH_ISSUER = "RFC 9207"; // source: SPEC_REF_R10_AUTH — confirmed

// ─── R11 — Removed methods / headers ───────────────────────────────────────

// source: SOURCE_FINAL_CHANGELOG — confirmed (all removed in 2026-07-28)
export const METHOD_PING = "ping";
export const METHOD_LOGGING_SET_LEVEL = "logging/setLevel";
export const METHOD_ROOTS_LIST_CHANGED = "notifications/roots/list_changed";
export const METHOD_RESOURCES_SUBSCRIBE = "resources/subscribe";
export const METHOD_RESOURCES_UNSUBSCRIBE = "resources/unsubscribe";
export const METHOD_ELICITATION_COMPLETE = "notifications/elicitation/complete";
export const HEADER_LAST_EVENT_ID = "Last-Event-ID"; // SSE resumability removed
export const METHOD_SUBSCRIPTIONS_LISTEN = "subscriptions/listen"; // replacement for resources/subscribe

// ─── R12 — resultType on every result ──────────────────────────────────────

// source: SOURCE_FINAL_CHANGELOG (REQUIRED on all results) — confirmed
export const FIELD_RESULT_TYPE = "resultType";
export const RESULT_TYPE_COMPLETE = "complete";
export const METHOD_TOOLS_CALL = "tools/call";

// ─── F-series (--strict only, info) ────────────────────────────────────────

// source: JSON Schema 2020-12 meta-schema URI — confirmed (stable, spec-independent)
export const JSON_SCHEMA_DIALECT_2020_12 = "https://json-schema.org/draft/2020-12/schema";

// ─── R13 — Official SDK support for 2026-07-28 (facts as of 2026-10) ───────

const SOURCE_TS_SDK_MIGRATION = "https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28"; // confirmed
const SOURCE_TS_SDK_NPM = "https://www.npmjs.com/package/@modelcontextprotocol/sdk"; // confirmed
export const SOURCE_PY_SDK_RELEASES = "https://github.com/modelcontextprotocol/python-sdk/releases"; // confirmed
// source: SOURCE_TS_SDK_NPM — monolithic v1.x (latest 1.32.1) implements up to 2025-11-25; 07-28 not planned — confirmed
export const PKG_TS_SDK_V1 = "@modelcontextprotocol/sdk";
// source: SOURCE_TS_SDK_MIGRATION — v2 is split into server/client/node packages — confirmed
export const PKG_TS_SERVER_V2 = "@modelcontextprotocol/server";
// source: SOURCE_TS_SDK_MIGRATION — v2 speaks 07-28 only when the author opts in via one of these — confirmed
export const SDK_OPT_IN_HTTP = "createMcpHandler"; // also validates Mcp-Method / Mcp-Name
export const SDK_OPT_IN_STDIO = "serveStdio";
export const SDK_OPT_IN_TRANSPORT = "PerRequestHTTPServerTransport";
export const SDK_OPT_IN_ENTRY_POINTS = [SDK_OPT_IN_HTTP, SDK_OPT_IN_STDIO, SDK_OPT_IN_TRANSPORT];
// source: SOURCE_TS_SDK_MIGRATION — v2 authors replace these with inputRequired(...) (MRTR) — confirmed
export const SDK_SERVER_INITIATED_CALLS = ["elicitInput", "requestSampling"];
export const SDK_INPUT_REQUIRED_CALL = "inputRequired";
export const SDK_CACHE_HINTS = "cacheHints"; // source: SOURCE_TS_SDK_MIGRATION — confirmed
// source: SOURCE_PY_SDK_RELEASES — PyPI `mcp` >= 2.0.0 (released 2026-07-28) speaks 07-28 by default — confirmed
export const PKG_PY_MCP = "mcp";
export const PY_SDK_MIN_VERSION = "2.0.0";
// source: SOURCE_PY_SDK_RELEASES — v2 renamed FastMCP to MCPServer; mcp.server.fastmcp is a 1.x import path — confirmed
export const PY_FASTMCP_IMPORT = "mcp.server.fastmcp";
export const PY_SERVER_CLASS_V2 = "MCPServer";
export const PY_SERVER_CLASS_V1 = "FastMCP";
// source: SOURCE_PY_SDK_RELEASES — standalone `fastmcp` is a separate project; 07-28 support unknown — confirmed
export const PKG_PY_FASTMCP_STANDALONE = "fastmcp";
export const SPEC_REF_R13_SDK = SOURCE_TS_SDK_MIGRATION;

// ─── Heuristic: "does this project look like an MCP server?" ───────────────
// heuristic — tool-side convention, not a spec literal
export const MCP_SERVER_HINT = /modelcontextprotocol|McpServer|FastMCP|mcp\.server/i;

// ─── Spec section references (per-rule, for Finding.specRef) ──────────────
// Per-topic pages exist for these (HTTP 200 at build time); everything else falls back to the
// changelog rather than inventing an anchor.

export const SPEC_REF_R1_SESSIONS = `${SPEC_BASE}/basic/transports/streamable-http`; // confirmed
export const SPEC_REF_R2_HEADERS = `${SPEC_BASE}/basic/transports/streamable-http`; // confirmed
export const SPEC_REF_R3_ERROR_CODE = `${SPEC_BASE}/basic/index`; // confirmed
export const SPEC_REF_R4_TTL_MS = SOURCE_FINAL_CHANGELOG;
export const SPEC_REF_R5_TRACE_CONTEXT = SOURCE_FINAL_CHANGELOG;
export const SPEC_REF_R6_DEPRECATED = SOURCE_DEPRECATED_REGISTRY;
export const SPEC_REF_R7_DISCOVER = SOURCE_FINAL_CHANGELOG;
export const SPEC_REF_R8_MRTR = `${SPEC_BASE}/basic/patterns/mrtr`; // confirmed
export const SPEC_REF_R9_TASKS = SOURCE_FINAL_CHANGELOG;
export const SPEC_REF_R10_AUTH = `${SPEC_BASE}/basic/authorization`; // confirmed
export const SPEC_REF_R11_REMOVED = SOURCE_FINAL_CHANGELOG;
export const SPEC_REF_R12_RESULT_TYPE = SOURCE_FINAL_CHANGELOG;
export const SPEC_REF_F_SERIES = SOURCE_FINAL_CHANGELOG;

// ─── C6 footer hook ─────────────────────────────────────────────────────────

// placeholder — Adam to confirm final contact before publish
export const CONTACT_EMAIL = "hello@workingmodel.co";
export const FOOTER_MESSAGE = `Need this done for you? Working Model runs fixed-price MCP migration sprints — ${CONTACT_EMAIL}.`;
