// One call to a tool of factory's MCP endpoint (/api/v1/mcp), shared by
// metrics, link and login. The endpoint is stateless: tools/call needs no
// handshake. Errors carry a sentence the person can act on, never a body.
const { postJson } = require("./factory");

const TIMEOUT_MS = 15000;
const MCP_HEADERS = { Accept: "application/json, text/event-stream" };

class FactoryError extends Error {}

// Streamable HTTP may answer as plain JSON or as an SSE stream.
function parseRpc(res, id) {
  if (res.type.includes("text/event-stream")) {
    for (const line of res.body.split("\n")) {
      if (!line.startsWith("data:")) continue;
      try {
        const msg = JSON.parse(line.slice(5));
        if (msg.id === id) return msg;
      } catch { /* keep scanning */ }
    }
    return null;
  }
  try { return JSON.parse(res.body); } catch { return null; }
}

async function callTool(url, token, name, args = {}, timeoutMs = TIMEOUT_MS) {
  const res = await postJson(`${url}/mcp`, token,
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }, timeoutMs, MCP_HEADERS);
  if (res.status === 401) {
    throw new FactoryError("factory rejected the token (revoked or expired). Run /crew:factory login");
  }
  if (res.status === 403) {
    throw new FactoryError("factory denied access: the person needs tasks.list and must take part in the project");
  }
  const msg = parseRpc(res, 1);
  if (!msg) throw new FactoryError(`factory answered HTTP ${res.status} without a JSON-RPC message`);
  if (msg.error) throw new FactoryError(msg.error.message || "JSON-RPC error");
  const text = (msg.result && msg.result.content && msg.result.content[0] && msg.result.content[0].text) || "";
  if (msg.result.isError) throw new FactoryError(text || "tool error");
  return JSON.parse(text);
}

module.exports = { callTool, parseRpc, FactoryError };
