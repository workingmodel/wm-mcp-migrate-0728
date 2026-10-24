import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name: "demo", version: "1.0.0" });
// Registers tools but never implements the discovery method.
server.tool("search", async () => ({ content: [] }));
