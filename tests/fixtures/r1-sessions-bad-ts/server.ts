import express from "express";

const app = express();
const sessions = new Map<string, { createdAt: number }>();

app.post("/mcp", (req, res) => {
  const sessionId = req.headers["Mcp-Session-Id"];
  if (!sessionId) {
    return res.status(400).send("missing session");
  }

  if (req.body.method === "initialize") {
    sessions.set(sessionId as string, { createdAt: Date.now() });
    return res.json({ jsonrpc: "2.0", result: {} });
  }

  if (req.body.method === "notifications/initialized") {
    return res.json({ jsonrpc: "2.0", result: {} });
  }

  res.json({ jsonrpc: "2.0", result: {} });
});

app.listen(3000);
