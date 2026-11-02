// Activity capture for factory mode (SessionStart, UserPromptSubmit, Stop,
// SessionEnd, PostToolUse on edits). Records WHEN the person and the agent
// were working — timestamps, session id, and which work item was being
// edited. Prompt and response content is never read: only the hook's
// envelope fields (session_id, hook_event_name, cwd, tool_input.file_path,
// and the file headers of a Codex apply_patch).
//
// Quiet by contract: the only output is a {"systemMessage"} the person sees
// when capture needs them (hooks/lib/factory-alerts.js), at session start or
// when a send meets a new problem. Nothing ever goes into the model's
// context, and any failure exits 0 without effect.
const fs = require("node:fs");
const { join, dirname, isAbsolute, resolve } = require("node:path");
const { randomUUID } = require("node:crypto");
const { loadConfig, configDir } = require("./lib/config");
const { captureToken, factoryApi } = require("./lib/factory");
const { applyEvent, taskHintFor } = require("./lib/activity-rules");
const { activityDir, enqueue, flush, readStatus } = require("./lib/activity-queue");
const { factoryAlert } = require("./lib/factory-alerts");

const FLUSH_ON = new Set(["SessionStart", "Stop", "SessionEnd"]);
// Problems a send can discover; each is shown once, when it first appears.
const DISCOVERED = new Set(["rejected", "expired", "no-person"]);

function statePath(sessionId) {
  return join(activityDir(), `${String(sessionId).replace(/[^\w-]/g, "_")}.json`);
}

function readState(path) {
  try { return JSON.parse(fs.readFileSync(path, "utf8")); } catch { return {}; }
}

const STALE_MS = 48 * 3600000;
const PATCH_TARGET = /^\*\*\* (?:Add File|Update File|Move to): (.+)$/gm;

// Sessions that died without SessionEnd leave their state behind; only the
// per-session *.json files are pruned, never the queue or the status.
function pruneStaleSessions(now) {
  const dir = activityDir();
  const kept = new Set(["status.json", "held-owner.json"]);
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !kept.has(f))) {
    try {
      const file = join(dir, name);
      if (now - fs.statSync(file).mtimeMs > STALE_MS) fs.rmSync(file, { force: true });
    } catch { /* another session got there first */ }
  }
}

// Claude edits carry file_path; a Codex apply_patch carries the patch text,
// whose file headers name the touched paths.
function editedPaths(toolInput) {
  if (!toolInput) return [];
  if (typeof toolInput.file_path === "string" && toolInput.file_path) return [toolInput.file_path];
  if (typeof toolInput.command !== "string") return [];
  return [...toolInput.command.matchAll(PATCH_TARGET)].map((m) => m[1].trim());
}

function editHint(input) {
  const cwd = input.cwd || process.cwd();
  for (const file of editedPaths(input.tool_input)) {
    const abs = isAbsolute(file) ? file : resolve(cwd, file);
    const hint = taskHintFor(configDir(dirname(abs)) || configDir(cwd), abs, cwd);
    if (hint) return hint;
  }
  return null;
}

// The alert to show after this event, or null.
function alertAfter(name, cfg, now, before) {
  const alert = factoryAlert(cfg, now);
  if (!alert || !alert.human) return null;
  if (name === "SessionStart") return alert;
  return DISCOVERED.has(alert.key) && alert.key !== before ? alert : null;
}

async function capture(input) {
  const name = input.hook_event_name;
  const sessionId = input.session_id;
  if (!name || !sessionId) return null;
  const cfg = loadConfig(input.cwd || process.cwd());
  const now = Date.now();
  const token = captureToken(cfg, now);
  if (!token) return name === "SessionStart" ? alertAfter(name, cfg, now, null) : null;
  const before = readStatus().problem;

  if (name === "SessionStart") pruneStaleSessions(now);
  const path = statePath(sessionId);
  const event = { name, hint: name === "PostToolUse" ? editHint(input) : null };
  const ctx = { sessionId, projectId: cfg.factory.projectId, newId: () => randomUUID() };
  const { state, intervals } = applyEvent(readState(path), event, now, ctx);
  enqueue(intervals);
  if (name === "SessionEnd") fs.rmSync(path, { force: true });
  else fs.writeFileSync(path, JSON.stringify(state));
  if (FLUSH_ON.has(name)) await flush(factoryApi(cfg), token, now);
  return FLUSH_ON.has(name) ? alertAfter(name, cfg, now, before) : null;
}

async function main() {
  try {
    const input = JSON.parse(fs.readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
    const alert = await capture(input);
    if (alert) process.stdout.write(JSON.stringify({ systemMessage: `crew · factory: ${alert.text}` }));
  } catch {
    // Fail open and silent: capture must never disturb the session.
  }
  process.exit(0);
}

if (require.main === module) main();
module.exports = { capture };
