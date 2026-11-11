// PostToolUse on edits (Edit, Write, MultiEdit, Codex apply_patch), factory
// mode only. When the agent edits a story or requirement whose header names
// its factory activity (`**Factory activity:** <uuid>`), and that activity is
// not the one this session declared, tell the agent to call the factory MCP
// `declare_work` with it. Captured time then lands on that task instead of
// staying untasked, without depending on the agent remembering.
//
// What it reads: crew.json, the edited path, the first lines of that file and
// the capture's per-session state (hooks/lib/capture-state.js). It never
// calls factory. Silent when: no factory mode or capture is paused, solo
// mode, the file is no linked work item, the id is the declared one, the
// session completed that activity already (editing its status after closing),
// or this exact notice was already given for the same declared task.
const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { dirname, isAbsolute, resolve, join } = require("node:path");
const { tmpdir } = require("node:os");
const { createHash } = require("node:crypto");
const { loadConfig, configDir } = require("./lib/config");
const { captureToken } = require("./lib/factory");
const { taskHintFor } = require("./lib/activity-rules");
const { readSessionState, editedPaths } = require("./lib/capture-state");

// The first edited work item that names a factory activity: { id, rel }.
function linkedItem(input) {
  const cwd = input.cwd || process.cwd();
  for (const file of editedPaths(input.tool_input)) {
    const abs = isAbsolute(file) ? file : resolve(cwd, file);
    const hint = taskHintFor(configDir(dirname(abs)) || configDir(cwd), abs, cwd);
    if (hint && hint.taskId) return { id: hint.taskId, rel: hint.taskRef.externalKey.replace(/^[^:]*:/, "") };
  }
  return null;
}

// One notice per session, activity and declared task: an agent that chose
// not to declare is told once, not on every edit of the same file.
function firstTime(sessionId, id, declared) {
  const key = createHash("sha256").update(`${sessionId}|${id}|${declared || ""}`).digest("hex").slice(0, 16);
  const marker = join(tmpdir(), `crew-declare-${key}`);
  if (existsSync(marker)) return false;
  writeFileSync(marker, "");
  return true;
}

function notice(input) {
  const cfg = loadConfig(input.cwd || process.cwd());
  if (!cfg || cfg.mode === "solo" || !captureToken(cfg) || !input.session_id) return null;
  const item = linkedItem(input);
  if (!item) return null;
  const state = readSessionState(input.session_id);
  const declared = state.blockTaskId || null;
  if (declared === item.id || (state.completed || []).includes(item.id)) return null;
  if (!firstTime(input.session_id, item.id, declared)) return null;
  const now = declared ? `this session has another activity declared (${declared})` : "this session has no activity declared";
  return `Crew factory notice: you edited \`${item.rel}\`, whose header names Factory activity ${item.id}, and ${now}. ` +
    `Call the factory MCP tool declare_work with activityId ${item.id} now, before you continue, so the time captured ` +
    `from here on lands on that task. Skip it only when this edit is not the work you are doing (a passing fix to another item).`;
}

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
  const text = notice(input);
  if (text) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: text } }));
  }
} catch {
  // Silent: a notice is never worth an error.
}
process.exit(0);
