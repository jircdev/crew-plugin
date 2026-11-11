// The capture hook's per-session state, shared with the factory nudges that
// read it: which activity the session has declared (blockTaskId), which it
// completed, and the open work block. Only capture-activity.js writes it.
const fs = require("node:fs");
const { join } = require("node:path");
const { activityDir } = require("./activity-queue");

const PATCH_TARGET = /^\*\*\* (?:Add File|Update File|Move to): (.+)$/gm;

function sessionStatePath(sessionId) {
  return join(activityDir(), `${String(sessionId).replace(/[^\w-]/g, "_")}.json`);
}

function readStateFile(path) {
  try { return JSON.parse(fs.readFileSync(path, "utf8")); } catch { return {}; }
}

const readSessionState = (sessionId) => readStateFile(sessionStatePath(sessionId));

// Claude edits carry file_path; a Codex apply_patch carries the patch text,
// whose file headers name the touched paths.
function editedPaths(toolInput) {
  if (!toolInput) return [];
  if (typeof toolInput.file_path === "string" && toolInput.file_path) return [toolInput.file_path];
  if (typeof toolInput.command !== "string") return [];
  return [...toolInput.command.matchAll(PATCH_TARGET)].map((m) => m[1].trim());
}

module.exports = { sessionStatePath, readStateFile, readSessionState, editedPaths };
