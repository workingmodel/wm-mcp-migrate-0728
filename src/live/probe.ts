import {
  FIELD_CACHE_SCOPE,
  FIELD_PROTOCOL_VERSION,
  HEADER_MCP_METHOD,
  META_CLIENT_CAPABILITIES,
  META_CLIENT_INFO,
  META_FIELD,
  META_PROTOCOL_VERSION,
  METHOD_INITIALIZE,
  METHOD_RESOURCES_LIST,
  METHOD_RESOURCES_READ,
  METHOD_TOOLS_LIST,
  METHOD_SERVER_DISCOVER,
  SPEC_DATE,
  HEADER_MCP_NAME,
  HEADER_SESSION_ID,
  FIELD_TTL_MS,
  TRACE_FIELD_TRACEPARENT,
} from "../spec-constants.js";
import type { ProbeResult } from "../types.js";

const TOOL_NAME = "mcp-migrate-0728";
const TOOL_VERSION = "1.1.0"; // keep in step with package.json

let requestId = 0;
function nextId(): number {
  requestId += 1;
  return requestId;
}

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc?: "2.0";
  id?: number;
  result?: Record<string, unknown> & { capabilities?: Record<string, unknown> };
  error?: { code: number; message: string };
}

async function post(
  url: string,
  body: JsonRpcRequest,
  headers: Record<string, string> = {}
): Promise<{ status: number; json: JsonRpcResponse | null }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  let json: JsonRpcResponse | null = null;
  try {
    json = (await res.json()) as JsonRpcResponse;
  } catch {
    json = null;
  }

  return { status: res.status, json };
}

// Synthetic session id used to unblock probes R2–R6 against a server that still enforces
// the (soon-to-be-removed) session requirement. Without this, an old-spec server that
// requires a session would reject every probe below for "no session" rather than for the
// thing each probe is actually testing — masking real findings on the worst-offending
// servers. R1's own verdict is unaffected: it's based on the very first, session-less request.
const FALLBACK_SESSION_ID = "mcp-migrate-0728-probe-session";

/**
 * Connects to a running MCP server over Streamable HTTP and actively exercises the
 * 07-28 breaking-change surface. Uses native fetch + raw JSON-RPC — no MCP SDK — so we
 * keep full control over wire-level headers (required for R1/R2) and keep deps tiny.
 */
export async function probe(url: string): Promise<ProbeResult> {
  const result: ProbeResult = { url };

  // ── R1: session requirement ──────────────────────────────────────────────
  let requiredSession = false;
  try {
    const { status, json } = await post(url, {
      jsonrpc: "2.0",
      id: nextId(),
      method: METHOD_TOOLS_LIST,
    });
    // A server that still requires sessions will either reject with a 4xx or return a
    // JSON-RPC error complaining about a missing/invalid session id.
    requiredSession =
      status === 400 ||
      status === 401 ||
      Boolean(json?.error && /session/i.test(json.error.message));
    result.session = { ok: true, requiredSession };
  } catch (err) {
    result.connectError = err instanceof Error ? err.message : String(err);
    return result;
  }

  // Subsequent probes carry a fallback session header if (and only if) the server appears
  // to require one, so a still-session-requiring server doesn't mask every other check.
  const sessionHeader: Record<string, string> = requiredSession
    ? { [HEADER_SESSION_ID]: FALLBACK_SESSION_ID }
    : {};

  // ── R2: Mcp-Method / Mcp-Name header enforcement ─────────────────────────
  try {
    const withoutHeaders = await post(
      url,
      { jsonrpc: "2.0", id: nextId(), method: METHOD_TOOLS_LIST },
      sessionHeader
    );
    const acceptedWithoutHeaders = withoutHeaders.status < 400 && !withoutHeaders.json?.error;

    const mismatched = await post(
      url,
      { jsonrpc: "2.0", id: nextId(), method: METHOD_TOOLS_LIST },
      { ...sessionHeader, [HEADER_MCP_METHOD]: METHOD_RESOURCES_LIST, [HEADER_MCP_NAME]: "mismatch-probe" }
    );
    const acceptedWithMismatch = mismatched.status < 400 && !mismatched.json?.error;

    result.headers = { ok: true, acceptedWithoutHeaders, acceptedWithMismatch };
  } catch (err) {
    result.headers = { ok: false, error: err instanceof Error ? err.message : String(err), acceptedWithoutHeaders: false, acceptedWithMismatch: false };
  }

  // ── R3: missing-resource error code ──────────────────────────────────────
  try {
    const { json } = await post(
      url,
      {
        jsonrpc: "2.0",
        id: nextId(),
        method: METHOD_RESOURCES_READ,
        params: { uri: "mcp-migrate-0728://definitely-missing-resource" },
      },
      sessionHeader
    );
    if (json?.error) {
      result.errorCode = { ok: true, code: json.error.code };
    } else {
      result.errorCode = { ok: false, error: "server did not return a JSON-RPC error for a missing resource" };
    }
  } catch (err) {
    result.errorCode = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // ── R4: ttlMs on tools/list ───────────────────────────────────────────────
  try {
    const { json } = await post(url, { jsonrpc: "2.0", id: nextId(), method: METHOD_TOOLS_LIST }, sessionHeader);
    const hasTtlMs = Boolean(json?.result && FIELD_TTL_MS in json.result);
    const hasCacheScope = Boolean(json?.result && FIELD_CACHE_SCOPE in json.result);
    result.listCache = { ok: true, hasTtlMs, hasCacheScope };
  } catch (err) {
    result.listCache = { ok: false, error: err instanceof Error ? err.message : String(err), hasTtlMs: false, hasCacheScope: false };
  }

  // ── R5: trace context via _meta (best-effort, not directly observable) ──
  try {
    const { status, json } = await post(
      url,
      {
        jsonrpc: "2.0",
        id: nextId(),
        method: METHOD_TOOLS_LIST,
        params: { _meta: { [TRACE_FIELD_TRACEPARENT]: "00-0000000000000000000000000000aaaa-000000000000aaaa-01" } },
      },
      sessionHeader
    );
    const accepted = status < 400 && !json?.error;
    result.traceContext = { ok: true, accepted };
  } catch (err) {
    result.traceContext = { ok: false, error: err instanceof Error ? err.message : String(err), accepted: false };
  }

  // ── R6: advertised deprecated capabilities ───────────────────────────────
  // 07-28 servers MUST implement server/discover; try it first and fall back to the legacy
  // initialize handshake for servers that haven't migrated.
  try {
    const clientInfo = { name: TOOL_NAME, version: TOOL_VERSION };
    const discover = await post(
      url,
      {
        jsonrpc: "2.0",
        id: nextId(),
        method: METHOD_SERVER_DISCOVER,
        params: {
          [META_FIELD]: {
            [META_PROTOCOL_VERSION]: SPEC_DATE,
            [META_CLIENT_CAPABILITIES]: {},
            [META_CLIENT_INFO]: clientInfo,
          },
        },
      },
      sessionHeader
    );

    let json: JsonRpcResponse | null = discover.json;
    if (!json?.result || json.error) {
      json = (
        await post(
          url,
          {
            jsonrpc: "2.0",
            id: nextId(),
            method: METHOD_INITIALIZE,
            params: { [FIELD_PROTOCOL_VERSION]: SPEC_DATE, capabilities: {}, clientInfo },
          },
          sessionHeader
        )
      ).json;
    }
    const capabilities = json?.result?.capabilities ? Object.keys(json.result.capabilities) : [];
    result.capabilities = { ok: true, capabilities };
  } catch (err) {
    result.capabilities = { ok: false, error: err instanceof Error ? err.message : String(err), capabilities: [] };
  }

  return result;
}
