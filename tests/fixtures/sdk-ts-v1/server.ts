import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "demo", version: "1.0.0" });
server.registerTool("search", { description: "Search" }, async () => ({ content: [] }));
await server.connect(new StdioServerTransport());
