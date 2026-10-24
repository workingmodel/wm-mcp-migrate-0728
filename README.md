# @workingmodel/mcp-migrate-0728

Checks whether your MCP server survives the **2026-07-28 spec** — the breaking changes, statically and live. Developed by [Working Model](https://workingmodel.co).

> **Status:** v1.1.0 — checked against the final 2026-07-28 spec. See [`build-spec.md`](build-spec.md) for the original build specification.

```
mcp-migrate-0728

Target: ./my-server  (static)  +  https://my-server.example/mcp  (live)
Checking against MCP spec 2026-07-28 (final)

✖ [R1 Sessions] Server reads/writes Mcp-Session-Id and/or runs an initialize/notifications/initialized handshake — both are removed in the final 07-28 spec.
  → Move client metadata/capabilities/protocol version into per-request _meta; remove the handshake and any session store; switch sticky routing to round-robin. https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http

✖ [R2 Headers] Live probe: server accepted a request with no Mcp-Method / Mcp-Name headers.
  → Require and validate both headers; reject requests that omit them. https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http

✖ [R4 Cache metadata] Live probe: tools/list result has no cacheScope — it is REQUIRED in 07-28.
  → Add cacheScope ("public" or "private") to list results. https://modelcontextprotocol.io/specification/2026-07-28/changelog

Summary: 3 errors, 0 warnings — this server needs migration work for the 2026-07-28 spec.

Need this done for you? Working Model runs fixed-price MCP migration sprints — hello@workingmodel.co.
```

## What it does

Point it at an MCP server — its source (static analysis) or a running endpoint (live probe) — and it tells you what will break under the 2026-07-28 spec and how to fix each thing:

1. **Sessions eliminated** — client metadata moves to per-request `_meta`; no `initialize` handshake
2. **Required headers** — `Mcp-Method` and `Mcp-Name`
3. **Error-code change** — missing-resource errors (`-32002` → `-32602`)
4. **Cache metadata** — `ttlMs` and `cacheScope` on list/read results
5. **W3C Trace Context** — propagation via `_meta`
6. **Deprecated primitives** — Roots, Sampling, Logging
7. **`server/discover`** — now mandatory
8. **Multi Round-Trip Requests** — `InputRequiredResult` replaces server-initiated requests
9. **Tasks** — `tasks/list` removed; Tasks move to an extension
10. **Authorization `iss`** — RFC 9207 issuer handling
11. **Removed methods** — `ping`, `logging/setLevel`, subscribe/unsubscribe, SSE resumability, and more
12. **`resultType`** — required on every result

Both modes can run together (a path *and* `--url`): static and live findings are merged and grouped by rule.

## Install

```bash
npx @workingmodel/mcp-migrate-0728
```

## Usage

```bash
# Static analysis of a server project
mcp-migrate-0728 ./path/to/server

# Live probe of a running server
mcp-migrate-0728 --url https://my-server.example/mcp

# Both together — static + live findings merged
mcp-migrate-0728 ./path/to/server --url https://my-server.example/mcp

# CI-friendly JSON
mcp-migrate-0728 ./server --json

# Also run the forward-looking info-only check (F3: JSON Schema 2020-12)
mcp-migrate-0728 ./server --strict
```

**Exit codes:** `0` clean · `1` one or more `error`-severity findings · `2` the live probe couldn't connect (static findings, if any, still print).

## What It Checks

| Rule | Breaking change | Default severity |
|------|-----------------|-------------------|
| R1 | Sessions eliminated — client metadata moves to per-request `_meta` (`io.modelcontextprotocol/protocolVersion`) | error |
| R2 | Required routing headers `Mcp-Method` and `Mcp-Name` | error |
| R3 | Missing-resource error code `-32002` → `-32602` | error |
| R4 | Cache metadata: `ttlMs` and `cacheScope` required on `tools/list`, `prompts/list`, `resources/list`, `resources/read`, `resources/templates/list` | error |
| R5 | W3C Trace Context propagation via `_meta` | warning |
| R6 | Deprecated primitives: Roots, Sampling, Logging (removable in the first revision released on or after 2027-07-28) | warning |
| R7 | `server/discover` must be implemented | error |
| R8 | Server-initiated `sampling/createMessage` / `elicitation/create` / `roots/list` without `InputRequiredResult` (Multi Round-Trip Requests) | error |
| R9 | `tasks/list` removed (use `tasks/get` + `tasks/update`, `io.modelcontextprotocol/tasks` extension) | error |
| R10 | Authorization code without `iss` handling (RFC 9207) | warning |
| R11 | Removed methods/headers: `ping`, `logging/setLevel`, `notifications/roots/list_changed`, `resources/subscribe`/`unsubscribe`, `notifications/elicitation/complete`, `Last-Event-ID` | error |
| R12 | `resultType` required on every result | error |

`--strict` additionally runs one forward-looking `info`-only rule, F3 (JSON Schema 2020-12 dialect for `inputSchema`/`outputSchema`). It never blocks CI.

## How It Works

**Static mode** walks your project (skipping `node_modules`, `.git`, `dist`, Python virtualenvs, etc.), reads TS/JS and Python source, and heuristically pattern-matches each rule's signals — string/header/capability references, not an AST-level proof.

**Live-connect mode** speaks raw JSON-RPC over Streamable HTTP using native `fetch` — no MCP SDK dependency — so it can control headers at the wire level (required to test R1/R2) and keep the dependency footprint tiny (chalk is the only runtime dependency). It sends requests with and without the new headers, triggers a missing-resource error, calls `tools/list`, and reads advertised capabilities from `server/discover` (falling back to the legacy `initialize` call for servers that haven't migrated).

All spec-specific literals (header names, error codes, field names, method names, deprecation dates, spec URLs) live in one file, `src/spec-constants.ts`, each with a `// source:` link and a confidence tag. Updating this tool for a future spec revision is a single-file edit.

## Limitations

- Static analysis is **heuristic** (pattern-based, TS/JS + Python) — it produces a migration punch list, not a proof. A server that structures things unusually can produce false positives or false negatives.
- **Checked against the final 2026-07-28 spec.** The live probe covers R1–R6 only; R7–R12 are static heuristics (string/pattern signals, not proofs), so expect some false positives and negatives.
- The live probe covers the **Streamable HTTP** transport only.
- R5 (Trace Context) live-checking is best-effort: propagation isn't directly observable from the client, so an inconclusive result is reported as `info`, not a pass/fail verdict.

## Why This Exists

The MCP `2026-07-28` spec is the biggest breaking revision so far: it removes sessions and the `initialize` handshake, makes `server/discover`, routing headers, `resultType` and cache metadata mandatory, replaces server-initiated requests with Multi Round-Trip Requests, moves Tasks to an extension, removes several methods (`ping`, `logging/setLevel`, subscriptions, SSE resumability), changes an error code, and deprecates Roots, Sampling and Logging. This tool isn't a generic MCP "doctor" — it's scoped entirely to that one migration: what will break, and what to do about it.

## License

MIT © Working Model
