// Reads local Claude Code transcripts (<config>/projects/*/*.jsonl) back into
// the events live capture would have seen: session start, a prompt the person
// sent, the end of the agent's reply, and edits to work items. Only record
// shape, timestamps, session ids, the working directory (to pick this
// repository's sessions) and the paths of edited files are used. Message
// content is parsed in memory to classify a record and never kept.
const fs = require("node:fs");
const os = require("node:os");
const { join, resolve, sep } = require("node:path");
const { taskHintFor, IDLE_MS } = require("../../hooks/lib/activity-rules");
const { configDir } = require("../../hooks/lib/config-dir");

const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
// Text Claude Code itself puts in a user record: never a prompt the person wrote.
const SYNTHETIC = /^\s*(<task-notification|<local-command-|<system-reminder>|<ci-monitor-event|\[Request interrupted)/;
// Turns that start from something other than the person: notifications,
// another session, a schedule.
const NOT_HUMAN_ORIGIN = new Set(["sdk", "task_notification", "peer", "scheduled", "system"]);

function projectsDir() {
  return join(process.env.CLAUDE_CONFIG_DIR || join(os.homedir(), ".claude"), "projects");
}

// Top-level transcripts touched since `since` (subagent folders are skipped).
function transcriptFiles(since) {
  const out = [];
  let dirs = [];
  try { dirs = fs.readdirSync(projectsDir(), { withFileTypes: true }).filter((d) => d.isDirectory()); } catch { return out; }
  for (const d of dirs) {
    const dir = join(projectsDir(), d.name);
    for (const name of fs.readdirSync(dir)) {
      const file = join(dir, name);
      try {
        if (name.endsWith(".jsonl") && fs.statSync(file).mtimeMs >= since) out.push(file);
      } catch { /* vanished */ }
    }
  }
  return out;
}

const norm = (p) => (process.platform === "win32" ? resolve(p).toLowerCase() : resolve(p));
// Inside this repository, and not inside a nested one with its own crew.json.
function inside(root, cwd) {
  if (!cwd || !(norm(cwd) === norm(root) || norm(cwd).startsWith(norm(root) + sep))) return false;
  const governing = fs.existsSync(cwd) ? configDir(cwd) : null;
  return !governing || norm(governing) === norm(root);
}

const contentOf = (rec) => (rec.message ? rec.message.content : undefined);
const hasToolResult = (rec) => Array.isArray(contentOf(rec)) && contentOf(rec).some((c) => c && c.type === "tool_result");

// A user record that opens a turn: anything but a tool result or a record
// Claude Code adds on its own.
function startsTurn(rec) {
  return rec.type === "user" && !rec.isMeta && !rec.isSidechain && !rec.isCompactSummary && !hasToolResult(rec);
}

function isHumanPrompt(rec) {
  if (!startsTurn(rec) || NOT_HUMAN_ORIGIN.has(rec.turnOrigin) || rec.promptSource === "system") return false;
  const content = contentOf(rec);
  const text = typeof content === "string" ? content
    : Array.isArray(content) ? content.filter((c) => c && c.type === "text").map((c) => c.text).join("\n") : "";
  return !SYNTHETIC.test(text);
}

function editedPaths(rec) {
  const content = contentOf(rec);
  if (rec.type !== "assistant" || !Array.isArray(content)) return [];
  return content.filter((c) => c && c.type === "tool_use" && EDIT_TOOLS.has(c.name) && c.input)
    .map((c) => c.input.file_path || c.input.notebook_path).filter((p) => typeof p === "string");
}

// sessionId → records of this repository, deduplicated by record uuid (a
// resumed session copies earlier records) and sorted by time.
function readSessions(files, root, since) {
  const sessions = new Map();
  for (const file of files) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      let rec;
      try { rec = JSON.parse(line); } catch { continue; }
      if (!rec || typeof rec !== "object") continue;
      const at = Date.parse(rec.timestamp);
      if (!rec.sessionId || Number.isNaN(at) || at < since || !["user", "assistant"].includes(rec.type) || rec.isSidechain) continue;
      const session = sessions.get(rec.sessionId) || sessions.set(rec.sessionId, { cwd: null, records: new Map() }).get(rec.sessionId);
      if (!session.cwd && rec.cwd) session.cwd = rec.cwd;
      session.records.set(rec.uuid || `${file}:${at}:${session.records.size}`, { at, rec });
    }
  }
  const out = new Map();
  for (const [id, s] of sessions) {
    if (inside(root, s.cwd)) out.set(id, [...s.records.values()].sort((a, b) => a.at - b.at));
  }
  return out;
}

// The events of one session, in the shape applyEvent expects. A reply ends
// at the last record before the next turn opens. A silence longer than the
// idle cut inside a reply (a tool waiting for an answer, a machine asleep)
// ends the run there, and the work after it opens a new run with no time of
// the person's in between.
function eventsOf(records, root) {
  const events = [{ name: "SessionStart", at: records[0].at }];
  let open = null;
  for (const { at, rec } of records) {
    if (open !== null && at - open > IDLE_MS) {
      events.push({ name: "Stop", at: open }, { name: "UserPromptSubmit", at });
      open = at;
    }
    if (startsTurn(rec)) {
      if (open !== null) events.push({ name: "Stop", at: open });
      open = null;
      if (isHumanPrompt(rec)) { events.push({ name: "UserPromptSubmit", at }); open = at; }
      continue;
    }
    for (const path of editedPaths(rec)) {
      const hint = taskHintFor(root, path, rec.cwd || root);
      if (hint) events.push({ name: "PostToolUse", at, hint });
    }
    if (open !== null) open = at;
  }
  if (open !== null) events.push({ name: "Stop", at: open });
  return events;
}

module.exports = { transcriptFiles, readSessions, eventsOf, isHumanPrompt, projectsDir };
