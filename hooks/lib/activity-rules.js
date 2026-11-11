// Pure interval rules for the capture hook: given the session state, one
// event and the current time, return the next state and the intervals to
// queue. No IO here except reading a work item's header for the task hint,
// so a scripted event sequence with a fake clock exercises everything.
//
// Every interval belongs to a work block: the turns of a session the person
// reviews at once in factory. A block opens with the first turn and closes on
// a pause over IDLE_MS, at the end of the session, when the agent declares a
// different task (MCP declare_work) or completes one (update_activity). A cut
// in the middle of an agent reply splits that reply at the moment of the cut.
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
// The block factory's story sync writes under the header (`sync-stories`
// skill, ADR planning/001). It links the file by its path, never by a uuid
// line, so it proves the work item exists in factory just as the header does.
const FACTORY_BLOCK = /<!-- factory:start -->\s*\n\s*[-*]\s*\*\*Factory:\*\*\s*#\d+/;

function headOf(text) {
  return String(text || "").split("\n").slice(0, HEADER_LINES).join("\n");
}

function factoryTaskId(text) {
  const match = headOf(text).match(FACTORY_TASK);
  return match ? match[1].toLowerCase() : null;
}

// Linked to factory: a `**Factory activity:**` header, or the block the story
// sync writes. Both are header facts, read without calling factory.
function factoryLinked(text) {
  return factoryTaskId(text) !== null || FACTORY_BLOCK.test(headOf(text));
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

// ctx.newId(kind, from, to): live capture draws a random id; a rebuild from
// transcripts derives it from the session and the stretch, so a rerun
// produces the same ids. ctx.source marks rebuilt intervals. ctx.blocks false
// leaves the block out: a rebuild lets factory place its turns in the block
// the live capture already sent, so the same work is never two blocks.
function makeInterval(kind, from, to, state, ctx, extra = {}) {
  const blocks = ctx.blocks !== false;
  return {
    id: ctx.newId(kind, from, to),
    kind,
    startedAt: new Date(from).toISOString(),
    endedAt: new Date(to).toISOString(),
    sessionId: ctx.sessionId,
    projectId: ctx.projectId,
    ...(ctx.source ? { source: ctx.source } : {}),
    ...(state.taskHint || {}),
    ...(blocks && state.blockId ? { blockId: state.blockId } : {}),
    ...(blocks && state.blockTaskId ? { declaredTaskId: state.blockTaskId, declaredAt: state.declaredAt } : {}),
    ...extra,
  };
}

// A Stop may carry the word count of the turn's last answer (an integer the
// hook read from the transcript, never the text). It goes only on the agent
// interval that Stop closes; factory adds the reading time from it.
function answerWords(event) {
  return event.name === "Stop" && Number.isInteger(event.responseWords) && event.responseWords >= 0
    ? { responseWords: event.responseWords } : {};
}

function openBlock(state, now, ctx, taskId = null) {
  state.blockId = ctx.newId("block", now, now);
  if (taskId !== state.blockTaskId) state.declaredAt = taskId ? new Date(now).toISOString() : null;
  state.blockTaskId = taskId;
}

// A cut while the agent is replying: the reply so far stays in the old
// block, the rest of it starts the new one.
function cut(state, now, ctx, intervals, taskId) {
  if (state.promptAt !== null && now > state.promptAt) {
    intervals.push(makeInterval("agent", state.promptAt, now, state, ctx));
    state.promptAt = now;
  }
  openBlock(state, now, ctx, taskId);
}

// The activities this session completed and has not declared again, newest
// last. The declare nudge reads it so editing a closed item (its status line)
// never asks to declare that task again.
const COMPLETED_KEPT = 20;
function trackCompletion(state, event) {
  const done = (state.completed || []).filter((id) => id !== event.taskId && id !== state.blockTaskId);
  if (event.name === "Complete" && state.blockTaskId) done.push(state.blockTaskId);
  state.completed = done.slice(-COMPLETED_KEPT);
}

// event.name "Declare" carries taskId; "Complete" closes the declared work.
function applyWorkEvent(state, event, now, ctx, intervals) {
  trackCompletion(state, event);
  if (!state.blockId) return openBlock(state, now, ctx, event.name === "Declare" ? event.taskId : null);
  if (event.name === "Complete") return cut(state, now, ctx, intervals, null);
  if (!event.taskId || event.taskId === state.blockTaskId) return;
  if (!state.blockTaskId) {
    state.blockTaskId = event.taskId;
    state.declaredAt = new Date(now).toISOString();
    return;
  }
  cut(state, now, ctx, intervals, event.taskId);
}

// A Stop may carry the active stretches of the turn (hooks/lib/turn-activity.js):
// one agent interval goes per stretch, and each stretch after a silence opens
// a new block that keeps the declared task, as any pause does. The word count
// rides on the last one. Without stretches the run is one interval.
function pushAgentRun(state, event, now, ctx, intervals) {
  const from = state.promptAt;
  const pieces = event.name === "Stop" && Array.isArray(event.stretches)
    ? event.stretches.map((s) => ({ start: Math.max(s.start, from), end: Math.min(s.end, now) }))
      .filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start)
    : [];
  if (!pieces.length) {
    intervals.push(makeInterval("agent", from, now, state, ctx, answerWords(event)));
    return;
  }
  pieces.forEach((piece, i) => {
    if (i > 0) openBlock(state, piece.start, ctx, state.blockTaskId);
    const last = i === pieces.length - 1;
    intervals.push(makeInterval("agent", piece.start, piece.end, state, ctx, last ? answerWords(event) : {}));
  });
}

// event: { name, hint?, taskId?, responseWords?, stretches? } — hint is only
// present for PostToolUse edits, taskId for a "Declare", responseWords and
// stretches for a "Stop".
// Human time runs while the person has the turn: from the end of an agent
// reply (or the session start) to the next prompt, cut at IDLE_MS. Agent time
// runs from a prompt to the end of its reply, however long it takes, so the
// two never overlap. A prompt that arrives with a reply still pending (an
// interrupted turn, no Stop) closes that run, cut at IDLE_MS like human time.
function applyEvent(prev, event, now, ctx) {
  const state = { lastEventAt: null, promptAt: null, taskHint: null, blockId: null, blockTaskId: null, declaredAt: null, ...prev };
  const intervals = [];
  if (event.name === "PostToolUse") {
    if (event.hint) state.taskHint = event.hint;
    return { state, intervals };
  }
  if (event.name === "Declare" || event.name === "Complete") {
    applyWorkEvent(state, event, now, ctx, intervals);
    return { state, intervals };
  }
  if (!PRESENCE.has(event.name)) return { state, intervals };
  let paused = false;
  if (state.promptAt !== null) {
    const run = now - state.promptAt;
    const closes = event.name === "Stop" || event.name === "UserPromptSubmit";
    if (closes && run > 0 && (event.name === "Stop" || run <= IDLE_MS)) {
      pushAgentRun(state, event, now, ctx, intervals);
    } else {
      paused = true;
    }
    state.promptAt = null;
  } else {
    const gap = state.lastEventAt === null ? null : now - state.lastEventAt;
    if (gap !== null && gap > 0 && gap <= IDLE_MS) {
      intervals.push(makeInterval("human", state.lastEventAt, now, state, ctx));
    } else if (gap !== null && gap > IDLE_MS) {
      paused = true;
    }
  }
  // A pause is no change of topic: the new block keeps the declared task.
  if (!state.blockId || event.name === "SessionStart") openBlock(state, now, ctx);
  else if (paused) openBlock(state, now, ctx, state.blockTaskId);
  state.lastEventAt = now;
  if (event.name === "UserPromptSubmit") state.promptAt = now;
  if (event.name === "SessionEnd") state.blockId = null;
  return { state, intervals };
}

module.exports = { applyEvent, taskHintFor, factoryTaskId, factoryLinked, IDLE_MS };
