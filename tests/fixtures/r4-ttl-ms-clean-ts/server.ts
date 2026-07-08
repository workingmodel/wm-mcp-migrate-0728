// Handles the "tools/list" MCP method.
export function toolsList() {
  return {
    tools: [{ name: "search", description: "Search the web" }],
    ttlMs: 60000,
  };
}
