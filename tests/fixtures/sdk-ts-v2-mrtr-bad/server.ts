import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";

const server = new McpServer({ name: "demo", version: "1.0.0" });
server.registerTool("ask", { description: "Ask" }, async (_args, ctx) => {
  const answer = await ctx.elicitInput({ message: "Which region?" });
  return { content: [{ type: "text", text: String(answer) }] };
});
export const handler = createMcpHandler(server);
