import {
  FIELD_CACHE_SCOPE,
  FIELD_RESULT_TYPE,
  FIELD_TTL_MS,
  META_FIELD,
  METHOD_SERVER_DISCOVER,
  PKG_PY_FASTMCP_STANDALONE,
  PKG_PY_MCP,
  PKG_TS_SDK_V1,
  PKG_TS_SERVER_V2,
  PY_SDK_MIN_VERSION,
  PY_SERVER_CLASS_V1,
  PY_SERVER_CLASS_V2,
  SDK_CACHE_HINTS,
  SDK_OPT_IN_HTTP,
  SDK_OPT_IN_STDIO,
  SPEC_REF_R13_SDK,
} from "../spec-constants.js";
import type { Finding, Rule, StaticContext } from "../types.js";
import { staticFinding } from "./util.js";

const ID = "R13";
const TITLE = "SDK";

const OWNED = `${METHOD_SERVER_DISCOVER}, the ${META_FIELD} envelope, ${FIELD_RESULT_TYPE} and cache fields`;

function staticCheck(ctx: StaticContext): Finding[] {
  const { kind, installedVersion } = ctx.sdk;
  const f = (sev: Finding["severity"], message: string, fix: string) => [
    staticFinding(ID, sev, SPEC_REF_R13_SDK, message, fix),
  ];

  switch (kind) {
    case "ts-v1":
      return f(
        "error",
        `${PKG_TS_SDK_V1} (v1.x${installedVersion ? `, installed ${installedVersion}` : ""}) does not support 2026-07-28 — it stops at the 2025-11-25 spec and v1.x support is not planned.`,
        `Migrate to ${PKG_TS_SERVER_V2} v2 and opt in to 2026-07-28 via ${SDK_OPT_IN_HTTP} / ${SDK_OPT_IN_STDIO}.`
      );
    case "ts-v2-not-optedin":
      return f(
        "error",
        `${PKG_TS_SERVER_V2} v2 is installed but the server never opts in — it is still speaking the 2025-era protocol.`,
        `Serve through ${SDK_OPT_IN_HTTP} (HTTP) or ${SDK_OPT_IN_STDIO} (stdio) instead of server.connect(...).`
      );
    case "py-v1":
      return f(
        "error",
        `Python mcp SDK is below ${PY_SDK_MIN_VERSION} (or uses the 1.x FastMCP import path) and does not support 2026-07-28.`,
        `Upgrade to ${PKG_PY_MCP}>=${PY_SDK_MIN_VERSION} (${PY_SERVER_CLASS_V1} is now ${PY_SERVER_CLASS_V2}).`
      );
    case "py-unknown":
      return f(
        "info",
        `Python ${PKG_PY_MCP} SDK in use but no version bound could be read from the manifest.`,
        `Verify the installed ${PKG_PY_MCP} is >= ${PY_SDK_MIN_VERSION}; pin it in pyproject.toml / requirements.`
      );
    case "fastmcp-standalone":
      return f(
        "info",
        `Standalone ${PKG_PY_FASTMCP_STANDALONE} package in use — it is a separate project from the official SDK.`,
        `07-28 support depends on the ${PKG_PY_FASTMCP_STANDALONE} release — verify it before relying on it.`
      );
    case "ts-v2-optedin":
    case "py-v2":
      return f(
        "info",
        `Official SDK handles ${OWNED} — those checks are skipped for source-level scanning.`,
        `Set a real cache policy (${SDK_CACHE_HINTS}) if the SDK defaults (${FIELD_TTL_MS} 0, ${FIELD_CACHE_SCOPE} private) are too conservative.`
      );
    default:
      return [];
  }
}

export const r13Sdk: Rule = {
  id: ID,
  title: TITLE,
  severity: "error",
  specRef: SPEC_REF_R13_SDK,
  staticCheck,
};
