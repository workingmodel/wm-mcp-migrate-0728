import http from "http";
import type { AddressInfo } from "net";

interface MockServerOptions {
  requireSession?: boolean; // old-spec: reject requests without Mcp-Session-Id
  enforceRoutingHeaders?: boolean; // new-spec: require + validate Mcp-Method/Mcp-Name
  resourceErrorCode?: number; // code returned for resources/read on a missing resource
  includeTtlMs?: boolean; // whether tools/list responses include ttlMs
  rejectTraceContext?: boolean; // reject requests carrying _meta.traceparent as "unknown field"
  includeCacheScope?: boolean; // whether tools/list responses include cacheScope
  disableDiscover?: boolean; // old-spec: no server/discover (responds method-not-found)
  capabilities?: string[]; // capabilities advertised from server/discover and initialize
}

// Preset: a maximally non-migrated old-spec server — trips every rule at once. Used to
// regression-test that the session gate doesn't mask R2–R6 findings (see probe.ts).
export const FULLY_OLD_SPEC_OPTIONS: MockServerOptions = {
  requireSession: true,
  enforceRoutingHeaders: false,
  resourceErrorCode: -32002,
  includeTtlMs: false,
  includeCacheScope: false,
  disableDiscover: true,
  rejectTraceContext: true,
  capabilities: ["roots", "sampling", "logging"],
};

interface JsonRpcBody {
  jsonrpc: string;
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

function readBody(req: http.IncomingMessage): Promise<JsonRpcBody | null> {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(null);
      }
    });
  });
}

function send(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/**
 * Starts a minimal HTTP server emulating either old-spec or new-spec MCP server behavior,
 * for use in live-probe tests. Caller is responsible for calling `close()`.
 */
export function startMockServer(opts: MockServerOptions = {}): Promise<{ url: string; methods: string[]; close: () => Promise<void> }> {
  const methods: string[] = []; // every JSON-RPC method received, in order
  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST") {
      send(res, 404, { error: "not found" });
      return;
    }

    const body = await readBody(req);
    if (!body) {
      send(res, 400, { error: "bad json" });
      return;
    }

    methods.push(body.method);

    // R1: session requirement
    if (opts.requireSession) {
      const sessionId = req.headers["mcp-session-id"];
      if (!sessionId) {
        send(res, 400, {
          jsonrpc: "2.0",
          id: body.id,
          error: { code: -32000, message: "session required" },
        });
        return;
      }
    }

    // R2: routing header enforcement
    if (opts.enforceRoutingHeaders) {
      const mcpMethod = req.headers["mcp-method"];
      const mcpName = req.headers["mcp-name"];
      if (!mcpMethod || !mcpName) {
        send(res, 400, { jsonrpc: "2.0", id: body.id, error: { code: -32600, message: "missing routing headers" } });
        return;
      }
      if (mcpMethod !== body.method) {
        send(res, 400, { jsonrpc: "2.0", id: body.id, error: { code: -32600, message: "method mismatch" } });
        return;
      }
    }

    if (body.method === "resources/read") {
      const code = opts.resourceErrorCode ?? -32602;
      send(res, 200, { jsonrpc: "2.0", id: body.id, error: { code, message: "resource not found" } });
      return;
    }

    if (body.method === "tools/list") {
      // R5: trace context via _meta
      const traceparent = (body.params?._meta as Record<string, unknown> | undefined)?.traceparent;
      if (traceparent && opts.rejectTraceContext) {
        send(res, 400, { jsonrpc: "2.0", id: body.id, error: { code: -32602, message: "unknown _meta field" } });
        return;
      }

      const result: Record<string, unknown> = { tools: [{ name: "search" }] };
      if (opts.includeTtlMs) result.ttlMs = 60000;
      if (opts.includeCacheScope) result.cacheScope = "public";
      send(res, 200, { jsonrpc: "2.0", id: body.id, result });
      return;
    }

    if (body.method === "server/discover") {
      if (opts.disableDiscover) {
        send(res, 200, { jsonrpc: "2.0", id: body.id, error: { code: -32601, message: "method not found" } });
        return;
      }
      const capabilities: Record<string, unknown> = {};
      for (const cap of opts.capabilities ?? []) capabilities[cap] = {};
      send(res, 200, { jsonrpc: "2.0", id: body.id, result: { resultType: "complete", capabilities } });
      return;
    }

    if (body.method === "initialize") {
      const capabilities: Record<string, unknown> = {};
      for (const cap of opts.capabilities ?? []) capabilities[cap] = {};
      send(res, 200, { jsonrpc: "2.0", id: body.id, result: { capabilities } });
      return;
    }

    send(res, 200, { jsonrpc: "2.0", id: body.id, result: {} });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}/mcp`,
        methods,
        close: () => new Promise((res) => server.close(() => res())),
      });
    });
  });
}
