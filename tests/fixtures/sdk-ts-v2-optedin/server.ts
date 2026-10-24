import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";

const server = new McpServer({ name: "demo", version: "1.0.0" });
server.registerTool("search", { description: "Search" }, async () => ({ content: [] }));
export const handler = createMcpHandler(server);
