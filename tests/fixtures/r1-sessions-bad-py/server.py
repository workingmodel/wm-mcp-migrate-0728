from flask import Flask, request, jsonify

app = Flask(__name__)
sessions = {}


@app.route("/mcp", methods=["POST"])
def mcp():
    session_id = request.headers.get("Mcp-Session-Id")
    body = request.get_json()

    if body.get("method") == "initialize":
        sessions[session_id] = {"created": True}
        return jsonify({"jsonrpc": "2.0", "result": {}})

    if session_id not in sessions:
        return jsonify({"error": "no session"}), 400

    return jsonify({"jsonrpc": "2.0", "result": {}})
