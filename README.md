# @workingmodel/mcp-migrate-0728

Checks whether your MCP server survives the **2026-07-28 spec** — the six breaking changes, statically and live. Developed by [Working Model](https://workingmodel.co).

> **Status:** build in progress. See [`build-spec.md`](build-spec.md) for the full specification. The 2026-07-28 spec is a release candidate until it finalizes on 2026-07-28 — this tool's checks update when the final spec lands.

## What it does

Point it at an MCP server — its source (static analysis) or a running endpoint (live probe) — and it tells you what will break under the 2026-07-28 spec and how to fix each thing:

1. **Sessions eliminated** — client metadata moves to per-request `_meta`
2. **New required headers** — `Mcp-Method` and `Mcp-Name`
3. **Error-code change** — missing-resource errors
4. **`ttlMs` list caching** — tool/resource list responses
5. **W3C Trace Context** — propagation via `_meta`
6. **Deprecated primitives** — Roots, Sampling, Logging

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

# CI-friendly JSON
mcp-migrate-0728 ./server --json
```

Exits `1` if any breaking change will hit your server — pipe-friendly for CI.

## Limitations

- Static analysis is **heuristic** (pattern-based, TS/JS + Python) — it produces a migration punch list, not a proof.
- The 2026-07-28 spec is an RC until final; exact literals may change and this tool updates when it does.
- The live probe covers the **Streamable HTTP** transport.

## License

MIT © Working Model
