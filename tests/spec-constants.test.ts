import { describe, expect, it } from "vitest";
import * as specConstants from "../src/spec-constants.js";
import { ALL_RULES } from "../src/rules/index.js";

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
