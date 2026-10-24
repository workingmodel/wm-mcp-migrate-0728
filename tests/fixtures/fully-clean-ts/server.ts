import express from "express";

const app = express();

app.post("/mcp", (req, res) => {
  const mcpMethod = req.headers["Mcp-Method"];
  const mcpName = req.headers["Mcp-Name"];
  if (!mcpMethod || !mcpName || mcpMethod !== req.body.method) {
    return res.status(400).send("bad routing headers");
  }

  const clientMeta = req.body._meta ?? {};
  const protocolVersion = clientMeta["io.modelcontextprotocol/protocolVersion"];
  const traceparent = clientMeta.traceparent;
  const tracestate = clientMeta.tracestate;

  if (req.body.method === "server/discover") {
    return res.json({ jsonrpc: "2.0", result: { resultType: "complete", capabilities: { tools: {} } } });
  }

  if (req.body.method === "tools/list") {
    return res.json({
      jsonrpc: "2.0",
      result: { resultType: "complete", tools: [], ttlMs: 60000, cacheScope: "public" },
    });
  }

  res.json({ jsonrpc: "2.0", result: { resultType: "complete", protocolVersion, traceparent, tracestate } });
});

app.listen(3000);
