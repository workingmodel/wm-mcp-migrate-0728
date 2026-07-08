import express from "express";

const app = express();

app.post("/mcp", (req, res) => {
  const mcpMethod = req.headers["Mcp-Method"];
  const mcpName = req.headers["Mcp-Name"];

  if (!mcpMethod || !mcpName) {
    return res.status(400).send("missing routing headers");
  }
  if (mcpMethod !== req.body.method) {
    return res.status(400).send("method mismatch");
  }

  res.json({ jsonrpc: "2.0", result: {} });
});

app.listen(3000);
