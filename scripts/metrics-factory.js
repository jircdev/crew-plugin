// Factory-mode metrics: the backlog, estimates and consumed hours live in
// factory, so the report reads them through factory's MCP endpoint (tool
// `project_backlog`) instead of parsing markdown tables.
const { postJson, factoryToken } = require("../hooks/lib/factory");

const TIMEOUT_MS = 15000;
const PROTOCOL_VERSION = "2025-03-26";
const MCP_HEADERS = { Accept: "application/json, text/event-stream" };
const OPEN = new Set(["backlog", "todo", "in_progress", "in_review"]);

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

async function rpc(url, token, message, headers = {}) {
  const res = await postJson(`${url}/mcp`, token, { jsonrpc: "2.0", ...message }, TIMEOUT_MS,
    { ...MCP_HEADERS, ...headers });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`factory rejected the token (HTTP ${res.status}); create a new one in factory`);
  }
  return { res, msg: message.id === undefined ? null : parseRpc(res, message.id) };
}

// Each POST is independent on a stateless server. If it still insists on a
// handshake, do initialize + notifications/initialized and retry once.
async function handshake(url, token) {
  const params = { protocolVersion: PROTOCOL_VERSION, capabilities: {},
    clientInfo: { name: "crew-metrics", version: "1" } };
  const { res } = await rpc(url, token, { id: 1, method: "initialize", params });
  const session = res.headers.get("mcp-session-id");
  const headers = session ? { "Mcp-Session-Id": session } : {};
  await rpc(url, token, { method: "notifications/initialized" }, headers);
  return headers;
}

async function callTool(url, token, name, args) {
  const call = { method: "tools/call", params: { name, arguments: args } };
  let { res, msg } = await rpc(url, token, { id: 2, ...call });
  if (!msg || msg.error) ({ res, msg } = await rpc(url, token, { id: 3, ...call }, await handshake(url, token)));
  if (!msg) throw new Error(`factory answered HTTP ${res.status} without a JSON-RPC message`);
  if (msg.error) throw new Error(msg.error.message || "JSON-RPC error");
  const text = (msg.result && msg.result.content && msg.result.content[0] && msg.result.content[0].text) || "";
  if (msg.result.isError) throw new Error(text || "tool error");
  return JSON.parse(text);
}

const hours = (x) => (typeof x === "number" ? x.toFixed(1) : "—");
const pct = (x) => (x === null ? "—" : `${x >= 0 ? "+" : ""}${x.toFixed(0)}%`);

// Done work compares what it consumed with the original estimate; open work
// compares its current estimate with the original (estimate drift so far).
function deviation(task) {
  const base = task.originalEstimatedHours;
  if (typeof base !== "number" || base <= 0) return null;
  const now = OPEN.has(task.status) ? task.estimatedHours : task.consumedHours;
  return typeof now === "number" ? ((now - base) / base) * 100 : null;
}

function render(backlog) {
  const lines = [`Project: ${backlog.projectName || backlog.projectId} (factory)`, ""];
  lines.push("| # | Task | Status | Original est (h) | Current est (h) | Consumed (h) | Deviation |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const t of backlog.tasks || []) {
    lines.push(`| ${t.number} | ${t.title} | ${t.status} | ${hours(t.originalEstimatedHours)} | ` +
      `${hours(t.estimatedHours)} | ${hours(t.consumedHours)} | ${pct(deviation(t))} |`);
  }
  const s = backlog.summary || {};
  const drift = s.approvedHours > 0 ? ((s.forecastHours - s.approvedHours) / s.approvedHours) * 100 : null;
  lines.push("", `Approved ${hours(s.approvedHours)}h · consumed ${hours(s.consumedHours)}h · ` +
    `pending ${hours(s.pendingHours)}h · forecast ${hours(s.forecastHours)}h (${pct(drift)} vs approved)`);
  return lines.join("\n");
}

async function factoryReport(factory, args) {
  const token = factoryToken();
  if (!token) {
    console.error("Factory mode: no token. Set FACTORY_TOKEN or write it to ~/.crew/factory-token " +
      "(create it in factory: Mis horas → Conectar con la IA).");
    return 1;
  }
  if (args.length) console.log("Note: period and --csv apply to the markdown report only; factory shows the live backlog.\n");
  try {
    console.log(render(await callTool(factory.url, token, "project_backlog", { projectId: factory.projectId })));
    return 0;
  } catch (error) {
    console.error(`Could not read the backlog from factory (${factory.url}): ${error.message}`);
    return 1;
  }
}

module.exports = { factoryReport, render, deviation, parseRpc };
