from mcp.server import MCPServer

app = MCPServer("demo")


@app.tool()
def search(q: str) -> str:
    return q
