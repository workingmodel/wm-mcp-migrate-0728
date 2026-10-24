// Handles the "tools/list" MCP method.
export function toolsList() {
  return {
    resultType: "complete",
    tools: [{ name: "search", description: "Search the web" }],
    ttlMs: 60000,
    cacheScope: "public",
  };
}
