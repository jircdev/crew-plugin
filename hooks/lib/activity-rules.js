// Pure interval rules for the capture hook: given the session state, one
// event and the current time, return the next state and the intervals to
// queue. No IO here except reading a work item's header for the task hint,
// so a scripted event sequence with a fake clock exercises everything.
const { readFileSync } = require("node:fs");
const { relative, basename, isAbsolute, resolve, sep } = require("node:path");

const IDLE_MS = 15 * 60 * 1000;
const PRESENCE = new Set(["SessionStart", "UserPromptSubmit", "Stop", "SessionEnd"]);
const HEADER_LINES = 40;
// `Factory activity:` is factory's current word (ADR costing/003); `Factory
// task:` stays valid for work items written before it.
const FACTORY_TASK =
  /\*\*Factory (?:task|activity):\*\*\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
const WORK_ITEM = /^docs\/(stories|requirements)\//i;

function factoryTaskId(text) {
  const head = String(text || "").split("\n").slice(0, HEADER_LINES).join("\n");
  const match = head.match(FACTORY_TASK);
  return match ? match[1].toLowerCase() : null;
}

// The task an edit points at: the work item's repo reference, plus the factory
// task id when the file's header declares one. Null when the file is not a
// story or requirement of this project.
function taskHintFor(configRoot, filePath, cwd) {
  if (!configRoot || !filePath) return null;
  const abs = isAbsolute(filePath) ? filePath : resolve(cwd || configRoot, filePath);
  const rel = relative(configRoot, abs).split(sep).join("/");
  if (!WORK_ITEM.test(rel)) return null;
  const hint = { taskRef: { system: "repo", externalKey: `${basename(configRoot)}:${rel}` } };
  let text = "";
  try { text = readFileSync(abs, "utf8"); } catch { /* new or unreadable: ref only */ }
  const taskId = factoryTaskId(text);
  return taskId ? { taskId, ...hint } : hint;
}

function makeInterval(kind, from, to, state, ctx) {
  return {
    id: ctx.newId(),
    kind,
    startedAt: new Date(from).toISOString(),
    endedAt: new Date(to).toISOString(),
    sessionId: ctx.sessionId,
    projectId: ctx.projectId,
    ...(state.taskHint || {}),
  };
}

// event: { name, hint? } — hint is only present for PostToolUse edits.
// Human time runs while the person has the turn: from the end of an agent
// reply (or the session start) to the next prompt, cut at IDLE_MS. Agent time
// runs from a prompt to the end of its reply, however long it takes, so the
// two never overlap. A prompt that arrives with a reply still pending (an
// interrupted turn, no Stop) closes that run, cut at IDLE_MS like human time.
function applyEvent(prev, event, now, ctx) {
  const state = { lastEventAt: null, promptAt: null, taskHint: null, ...prev };
  const intervals = [];
  if (event.name === "PostToolUse") {
    if (event.hint) state.taskHint = event.hint;
    return { state, intervals };
  }
  if (!PRESENCE.has(event.name)) return { state, intervals };
  if (state.promptAt !== null) {
    const run = now - state.promptAt;
    const closes = event.name === "Stop" || event.name === "UserPromptSubmit";
    if (closes && run > 0 && (event.name === "Stop" || run <= IDLE_MS)) {
      intervals.push(makeInterval("agent", state.promptAt, now, state, ctx));
    }
    state.promptAt = null;
  } else {
    const gap = state.lastEventAt === null ? null : now - state.lastEventAt;
    if (gap !== null && gap > 0 && gap <= IDLE_MS) {
      intervals.push(makeInterval("human", state.lastEventAt, now, state, ctx));
    }
  }
  state.lastEventAt = now;
  if (event.name === "UserPromptSubmit") state.promptAt = now;
  return { state, intervals };
}

module.exports = { applyEvent, taskHintFor, factoryTaskId, IDLE_MS };
