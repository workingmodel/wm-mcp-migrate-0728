import { runEngine } from "./engine.js";
import { probe } from "./live/probe.js";
import { buildJsonOutput, exitCode, renderFindings, renderHeader, renderJson, renderSummary } from "./renderer.js";
import { buildStaticContext } from "./static/scan.js";
import type { Finding, RunOptions } from "./types.js";

function parseArgs(argv: string[]): RunOptions {
  const opts: RunOptions = { json: false, strict: false };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") {
      opts.json = true;
    } else if (arg === "--strict") {
      opts.strict = true;
    } else if (arg === "--url") {
      const next = argv[i + 1];
      if (!next) throw new Error("--url requires a value");
      opts.url = next;
      i++;
    } else if (arg?.startsWith("--url=")) {
      opts.url = arg.slice("--url=".length);
    } else if (arg) {
      positional.push(arg);
    }
  }

  if (positional[0]) opts.path = positional[0];
  return opts;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  // Default to a static scan of cwd when neither --url nor a path is given.
  const staticPath = opts.url && !opts.path ? null : opts.path ?? process.cwd();

  const findings: Finding[] = [];
  let connectError = false;

  const staticCtx = staticPath ? buildStaticContext(staticPath) : undefined;

  let probeResult;
  if (opts.url) {
    probeResult = await probe(opts.url);
    if (probeResult.connectError) connectError = true;
  }

  findings.push(...runEngine({ staticCtx, probeResult, strict: opts.strict }));

  if (opts.json) {
    const output = buildJsonOutput({ staticPath, url: opts.url ?? null, findings });
    if (connectError) {
      (output as unknown as Record<string, unknown>).connectError = probeResult?.connectError;
    }
    renderJson(output);
  } else {
    renderHeader({ staticPath, url: opts.url ?? null });

    if (connectError) {
      console.error(`Live probe could not connect to ${opts.url}: ${probeResult?.connectError}`);
      console.error();
    }

    renderFindings(findings);
    renderSummary(findings);
  }

  process.exit(exitCode({ findings, connectError }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(2);
});
