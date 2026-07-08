import express from "express";

const app = express();

// Streamable HTTP transport, but never checks routing headers at all.
app.post("/mcp", (req, res) => {
  res.json({ jsonrpc: "2.0", result: {} });
});

app.listen(3000);
