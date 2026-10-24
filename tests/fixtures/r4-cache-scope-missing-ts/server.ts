// Handles the "resources/read" MCP method; sets only the TTL field.
export function resourcesRead() {
  return {
    resultType: "complete",
    contents: [],
    ttlMs: 1000,
  };
}
