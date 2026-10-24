// Hand-rolled MCP server (modelcontextprotocol): handles tool calls, no discovery method.
export function handle(method: string) {
  if (method === "tools/call") return { content: [] };
  return {};
}
