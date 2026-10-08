// Factory-mode metrics: the backlog, estimates and consumed hours live in
// factory, so the report reads them through factory's MCP endpoint (tool
// `project_backlog`) instead of parsing markdown tables. When factory cannot
// answer, the caller falls back to the local markdown report.
const { postJson, factoryToken, factoryApi } = require("../hooks/lib/factory");

const TIMEOUT_MS = 15000;
const MCP_HEADERS = { Accept: "application/json, text/event-stream" };
const OPEN = new Set(["backlog", "todo", "in_progress", "in_review"]);

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

// factory's MCP endpoint is stateless: tools/call needs no handshake.
async function callTool(url, token, name, args) {
  const res = await postJson(`${url}/mcp`, token,
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }, TIMEOUT_MS, MCP_HEADERS);
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

// The backlog is a flat list of every activity kind; render it as the tree
// its parentId describes. Appointments are calendar items, never backlog.
// Consumed hours are each activity's own (factory does not roll children up
// here), so only leaves carry a deviation.
function tree(tasks) {
  const work = tasks.filter((t) => t.kind !== "appointment");
  const ids = new Set(work.map((t) => t.id));
  const children = new Map();
  for (const t of work) {
    const parent = t.parentId && ids.has(t.parentId) ? t.parentId : null;
    (children.get(parent) || children.set(parent, []).get(parent)).push(t);
  }
  const out = [];
  const walk = (parent, depth) => {
    for (const t of children.get(parent) || []) {
      out.push({ task: t, depth, leaf: !children.has(t.id) });
      walk(t.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

function render(backlog) {
  const lines = [`Project: ${backlog.projectName || backlog.projectId} (factory)`, ""];
  lines.push("| Code | Activity | Kind | Status | Original est (h) | Current est (h) | Own consumed (h) | Deviation |");
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const { task: t, depth, leaf } of tree(backlog.tasks || [])) {
    const code = t.code || (t.number !== null && t.number !== undefined ? `#${t.number}` : "");
    lines.push(`| ${code} | ${"↳ ".repeat(depth)}${t.title} | ${t.kind || "task"} | ${t.status} | ` +
      `${hours(t.originalEstimatedHours)} | ${hours(t.estimatedHours)} | ${hours(t.consumedHours)} | ` +
      `${leaf ? pct(deviation(t)) : "—"} |`);
  }
  const s = backlog.summary || {};
  const drift = s.approvedHours > 0 ? ((s.forecastHours - s.approvedHours) / s.approvedHours) * 100 : null;
  lines.push("", `Quoted ${hours(s.approvedHours)}h · consumed ${hours(s.consumedHours)}h · ` +
    `pending ${hours(s.pendingHours)}h · forecast ${hours(s.forecastHours)}h (${pct(drift)} vs quoted)`);
  return lines.join("\n");
}

// Returns "ok", or "fallback" after printing why factory could not answer.
async function factoryReport(config, args) {
  const token = factoryToken();
  if (!token) {
    console.log("Factory mode: this machine is not connected to factory (run /crew:factory login). " +
      "Showing the local report.\n");
    return "fallback";
  }
  if (args.length) console.log("Note: period and --csv apply to the markdown report only; factory shows the live backlog.\n");
  const url = factoryApi(config);
  try {
    console.log(render(await callTool(url, token, "project_backlog", { projectId: config.factory.projectId })));
    return "ok";
  } catch (error) {
    const reason = error instanceof FactoryError ? error.message : `factory unreachable (${url})`;
    console.log(`Factory mode: ${reason}. Showing the local report.\n`);
    return "fallback";
  }
}

module.exports = { factoryReport, render, deviation, parseRpc, tree };
