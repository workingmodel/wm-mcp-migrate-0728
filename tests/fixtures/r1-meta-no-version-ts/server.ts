import express from "express";

const app = express();

// Reads _meta, but only the progress token — never the per-request protocol version.
app.post("/mcp", (req, res) => {
  const progressToken = req.body.params?._meta?.progressToken;
  res.json({ jsonrpc: "2.0", result: { progressToken } });
});

app.listen(3000);
