# @workingmodel/mcp-migrate-0728

Checks whether your MCP server survives the **2026-07-28 spec** — the six breaking changes, statically and live. Developed by [Working Model](https://workingmodel.co).

> **Status:** build in progress. See [`build-spec.md`](build-spec.md) for the full specification. The 2026-07-28 spec is a release candidate until it finalizes on 2026-07-28 — this tool's checks update when the final spec lands.

```
mcp-migrate-0728

Target: ./my-server  (static)  +  https://my-server.example/mcp  (live)
Checking against MCP spec 2026-07-28 (release candidate)

✖ [R1 Sessions] Server reads/writes Mcp-Session-Id and/or runs an initialize/initialized handshake — both are removed in 07-28.
  → Move client metadata/capabilities/protocol version into per-request _meta; remove the handshake and any session store; switch sticky routing to round-robin. https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/

✖ [R2 Headers] Live probe: server accepted a request with no Mcp-Method / Mcp-Name headers.
  → Require and validate both headers; reject requests that omit them. https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/

⚠ [R4 ttlMs] tools/list response has no ttlMs — clients can't cache your tool list.
  → Add ttlMs (ms) to list responses. Optional, but recommended before 07-28. https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/

Summary: 2 errors, 1 warning — this server needs migration work before 2026-07-28.

Need this done for you? Working Model runs fixed-price MCP migration sprints — hello@workingmodel.co.
```

## What it does

Point it at an MCP server — its source (static analysis) or a running endpoint (live probe) — and it tells you what will break under the 2026-07-28 spec and how to fix each thing:

1. **Sessions eliminated** — client metadata moves to per-request `_meta`
2. **New required headers** — `Mcp-Method` and `Mcp-Name`
3. **Error-code change** — missing-resource errors
4. **`ttlMs` list caching** — tool/resource list responses
5. **W3C Trace Context** — propagation via `_meta`
6. **Deprecated primitives** — Roots, Sampling, Logging

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

# Include forward-looking (post-07-28 roadmap) info-only signals
mcp-migrate-0728 ./server --strict
```

**Exit codes:** `0` clean · `1` one or more `error`-severity findings · `2` the live probe couldn't connect (static findings, if any, still print).

## What It Checks

| Rule | Breaking change | Default severity |
|------|-----------------|-------------------|
| R1 | Sessions eliminated — client metadata moves to per-request `_meta` | error |
| R2 | New required routing headers `Mcp-Method` and `Mcp-Name` | error |
| R3 | Error-code change for missing resource | warning* |
| R4 | `ttlMs` list-cache metadata on `tools/list` / `resources/list` | warning |
| R5 | W3C Trace Context propagation via `_meta` | warning |
| R6 | Deprecated primitives: Roots, Sampling, Logging (usable through ~May 2027) | warning |

\* R3's exact old→new error codes are partly sourced from an RC summarizer rather than confirmed against a primary source — downgraded to `warning` until confirmed against the final spec. See Limitations.

`--strict` additionally runs five forward-looking (`F1`–`F5`) `info`-only rules covering roadmap-direction changes beyond 07-28 (handshake removal via `server/discover`, `InputRequiredResult`, JSON Schema 2020-12, Tasks extension graduation, and the authorization `iss` parameter). These never block CI.

## How It Works

**Static mode** walks your project (skipping `node_modules`, `.git`, `dist`, Python virtualenvs, etc.), reads TS/JS and Python source, and heuristically pattern-matches each rule's signals — string/header/capability references, not an AST-level proof.

**Live-connect mode** speaks raw JSON-RPC over Streamable HTTP using native `fetch` — no MCP SDK dependency — so it can control headers at the wire level (required to test R1/R2) and keep the dependency footprint tiny (chalk is the only runtime dependency). It sends requests with and without the new headers, triggers a missing-resource error, calls `tools/list`, and inspects `initialize` capabilities.

All spec-specific literals (header names, error codes, field names, method names, deprecation dates, spec URLs) live in one file, `src/spec-constants.ts`, each tagged `confirmed` or `rc-summarizer — verify against final`. Updating this tool for the final 07-28 spec is a single-file edit.

## Limitations

- Static analysis is **heuristic** (pattern-based, TS/JS + Python) — it produces a migration punch list, not a proof. A server that structures things unusually can produce false positives or false negatives.
- **The 2026-07-28 spec is a Release Candidate, not final.** Several literals (notably the R3 missing-resource error code, and the F-series roadmap items) are sourced from a secondary builder-guide summary rather than confirmed against the primary MCP spec/blog at build time. This tool's rules update when the final spec lands on 2026-07-28 — check `src/spec-constants.ts` confidence tags if you need to know which literals to trust today.
- The live probe covers the **Streamable HTTP** transport only.
- R5 (Trace Context) live-checking is best-effort: propagation isn't directly observable from the client, so an inconclusive result is reported as `info`, not a pass/fail verdict.

## Why This Exists

The MCP `2026-07-28` spec removes sessions, adds required routing headers, changes an error code, and deprecates three primitives — with a hard external date and a roughly ten-week window where every MCP server maintainer is forced to care. This tool isn't a generic MCP "doctor" — it's scoped entirely to that one migration: what will break, and what to do about it, before the deadline.

## License

MIT © Working Model
