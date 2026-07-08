import express from "express";

const app = express();

app.post("/mcp", (req, res) => {
  const clientMeta = req.body._meta;
  const protocolVersion = clientMeta?.protocolVersion;

  res.json({ jsonrpc: "2.0", result: { protocolVersion } });
});

app.listen(3000);
