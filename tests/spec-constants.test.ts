import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import * as specConstants from "../src/spec-constants.js";
import { ALL_RULES } from "../src/rules/index.js";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

function listTs(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? listTs(full) : full.endsWith(".ts") ? [full] : [];
  });
}

describe("spec-constants — regression guard", () => {
  it("exports at least the core spec literals used by the rules", () => {
    const required = [
      "SPEC_DATE",
      "SPEC_STATUS",
      "HEADER_SESSION_ID",
      "HEADER_MCP_METHOD",
      "HEADER_MCP_NAME",
      "META_FIELD",
      "ERROR_CODE_RESOURCE_NOT_FOUND_LEGACY",
      "ERROR_CODE_RESOURCE_NOT_FOUND_NEW",
      "FIELD_TTL_MS",
      "FIELD_CACHE_SCOPE",
      "SOURCE_FINAL_CHANGELOG",
      "SOURCE_DEPRECATED_REGISTRY",
      "DEPRECATION_EARLIEST_REMOVAL",
      "META_PROTOCOL_VERSION",
      "FIELD_RESULT_TYPE",
      "METHOD_PING",
      "HEADER_LAST_EVENT_ID",
      "TRACE_FIELD_TRACEPARENT",
      "CAPABILITY_ROOTS",
      "CAPABILITY_SAMPLING",
      "CAPABILITY_LOGGING",
      "CONTACT_EMAIL",
      "FOOTER_MESSAGE",
    ];
    for (const name of required) {
      expect(specConstants).toHaveProperty(name);
    }
  });

  it("is marked final and no longer carries RC hedging", () => {
    expect(specConstants.SPEC_STATUS).toBe("final");
    const src = fs.readFileSync(path.join(SRC, "spec-constants.ts"), "utf8");
    expect(src).not.toMatch(/rc-summarizer|release candidate/i);
  });

  it("no spec literal leaks outside spec-constants.ts", () => {
    const literals = [
      specConstants.HEADER_SESSION_ID,
      specConstants.HEADER_MCP_METHOD,
      specConstants.HEADER_MCP_NAME,
      specConstants.HEADER_LAST_EVENT_ID,
      specConstants.META_PROTOCOL_VERSION,
      specConstants.META_CLIENT_CAPABILITIES,
      specConstants.META_LOG_LEVEL,
      specConstants.EXTENSION_TASKS,
      specConstants.METHOD_INITIALIZED,
      specConstants.METHOD_SERVER_DISCOVER,
      specConstants.METHOD_TOOLS_LIST,
      specConstants.METHOD_TOOLS_CALL,
      specConstants.METHOD_RESOURCES_READ,
      specConstants.METHOD_SAMPLING_CREATE_MESSAGE,
      specConstants.METHOD_ELICITATION_CREATE,
      specConstants.METHOD_TASKS_LIST,
      specConstants.METHOD_LOGGING_SET_LEVEL,
      specConstants.METHOD_ROOTS_LIST_CHANGED,
      specConstants.METHOD_RESOURCES_SUBSCRIBE,
      specConstants.METHOD_RESOURCES_UNSUBSCRIBE,
      specConstants.METHOD_ELICITATION_COMPLETE,
      specConstants.METHOD_SUBSCRIPTIONS_LISTEN,
      specConstants.RESULT_INPUT_REQUIRED,
      specConstants.RESULT_TYPE_INPUT_REQUIRED,
      specConstants.FIELD_RESULT_TYPE,
      specConstants.FIELD_TTL_MS,
      specConstants.FIELD_CACHE_SCOPE,
      specConstants.DEPRECATION_EARLIEST_REMOVAL,
      String(specConstants.ERROR_CODE_RESOURCE_NOT_FOUND_LEGACY),
      "https://modelcontextprotocol.io",
    ];
    const offenders: string[] = [];
    for (const file of listTs(SRC)) {
      if (path.basename(file) === "spec-constants.ts") continue;
      const code = fs
        .readFileSync(file, "utf8")
        .split("\n")
        .filter((l) => !/^\s*(\/\/|\*)/.test(l)) // ignore comment-only lines
        .join("\n");
      for (const lit of literals) {
        // A leak is the literal inside a string literal, not an identifier or a template placeholder.
        if (new RegExp(`["'\`][^"'\`]*${lit.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}[^"'\`]*["'\`]`).test(code)) {
          offenders.push(`${path.relative(SRC, file)}: ${lit}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every rule (including F-series) has a non-empty specRef", () => {
    for (const rule of ALL_RULES) {
      expect(rule.specRef).toBeTruthy();
      expect(rule.specRef.length).toBeGreaterThan(0);
    }
  });

  it("every rule has a non-empty id and title", () => {
    for (const rule of ALL_RULES) {
      expect(rule.id.length).toBeGreaterThan(0);
      expect(rule.title.length).toBeGreaterThan(0);
    }
  });
});
