# Changelog

## 1.1.0

Updated from the 2026-07-28 Release Candidate to the **final** spec (primary sources: the official changelog and deprecated registry). All literals retagged `confirmed`; RC hedging removed.

- **R3** Error Code: now `error` severity (resource-not-found `-32002` → `-32602` confirmed); "verify against final" wording removed.
- **R4** is now "Cache metadata": `ttlMs` **and** `cacheScope` are required on `tools/list`, `prompts/list`, `resources/list`, `resources/read`, `resources/templates/list` results. Now `error`; static flags each missing field, live checks `tools/list` for both.
- **R1** static: also flags servers that read `_meta` but never reference `io.modelcontextprotocol/protocolVersion`.
- **R6** message: removal is "the first spec revision released on or after 2027-07-28" (was "~May 2027").
- **New core rules** (promoted from `--strict`): R7 `server/discover` (error), R8 Multi Round-Trip Requests (error; only flags servers that send server-initiated `sampling/createMessage` / `elicitation/create` / `roots/list`), R9 `tasks/list` removed (error), R10 authorization `iss` (warning).
- **New core rules:** R11 removed methods/headers (`ping`, `logging/setLevel`, `notifications/roots/list_changed`, `resources/subscribe`/`unsubscribe`, `notifications/elicitation/complete`, `Last-Event-ID`), R12 required `resultType`. Static only.
- `--strict` now runs only F3 (JSON Schema 2020-12, info). F1, F2, F4, F5 are gone (replaced by R7–R10).
- Live probe: reads capabilities from `server/discover`, falling back to `initialize` for non-migrated servers.

## 1.0.0

Initial build: static (TS/JS + Python heuristic) and live-connect (Streamable HTTP, native `fetch`) checks for the six MCP `2026-07-28` breaking changes (R1–R6), plus opt-in `--strict` forward-looking F-series info rules. `--json` output, exit codes 0/1/2. All spec literals isolated in `src/spec-constants.ts` with per-constant source + confidence tags — several literals unconfirmed against a primary source pending the 2026-07-28 final spec (see README Limitations).
