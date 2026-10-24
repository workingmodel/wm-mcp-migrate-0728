import { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";

const server = new McpServer({ name: "demo", version: "1.0.0" });
server.registerTool("search", { description: "Search" }, async () => ({ content: [] }));
await server.connect(new StdioServerTransport());
