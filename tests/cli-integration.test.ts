import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { afterEach, describe, expect, it } from "vitest";
import { FULLY_OLD_SPEC_OPTIONS, startMockServer } from "./mock-server.js";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, "..", "dist", "index.js");
const FIXTURES = path.join(__dirname, "fixtures");

let cleanup: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (cleanup) {
    await cleanup();
    cleanup = null;
  }
});

async function run(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execFileAsync("node", [CLI, ...args]);
    return { stdout, stderr, code: 0 };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? "", code: e.code ?? 1 };
  }
}

// These exercise the built dist/index.js directly — they assume `npm run build` has already
// produced dist/. This mirrors how the CLI is actually invoked (§10 of build-spec.md).
describe("CLI integration — static mode", () => {
  it("exits 1 and prints errors for a non-migrated fixture", async () => {
    const { stdout, code } = await run([path.join(FIXTURES, "r1-sessions-bad-ts")]);
    expect(code).toBe(1);
    expect(stdout).toContain("R1 Sessions");
  });

  it("exits 0 for a fully clean fixture", async () => {
    const { stdout, code } = await run([path.join(FIXTURES, "fully-clean-ts")]);
    expect(code).toBe(0);
    expect(stdout).toContain("clean");
  });

  it("emits valid JSON with --json", async () => {
    const { stdout, code } = await run([path.join(FIXTURES, "r1-sessions-bad-ts"), "--json"]);
    expect(code).toBe(1);
    const parsed = JSON.parse(stdout);
    expect(parsed.mode).toBe("static");
    expect(Array.isArray(parsed.findings)).toBe(true);
  });
});

describe("CLI integration — live mode", () => {
  it("exits 1 and surfaces every rule against a fully non-migrated mock server", async () => {
    const mock = await startMockServer(FULLY_OLD_SPEC_OPTIONS);
    cleanup = mock.close;

    const { stdout, code } = await run(["--url", mock.url]);
    expect(code).toBe(1);
    expect(stdout).toContain("R1 Sessions");
    expect(stdout).toContain("R2 Headers");
  });

  it("exits 2 when the live probe cannot connect", async () => {
    const { stderr, code } = await run(["--url", "http://127.0.0.1:1/mcp"]);
    expect(code).toBe(2);
    expect(stderr).toContain("could not connect");
  });
});
