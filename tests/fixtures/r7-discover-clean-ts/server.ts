// Hand-rolled MCP server (modelcontextprotocol).
export function handle(method: string) {
  if (method === "server/discover") return { capabilities: { tools: {} } };
  if (method === "tools/call") return { content: [] };
  return {};
}
