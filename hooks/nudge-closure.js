// PostToolUse on shell tools, factory mode only. After a command that made a
// git commit (`git commit`, or the commit-cut skill's git-cut script), tell
// the agent to ask the programmer whether this commit closes the task, and
// what to do with each answer. A hook cannot talk to the person: it hands the
// agent the instruction, and the agent asks in chat.
//
// What it reads: crew.json, the command text (only to recognize a commit),
// HEAD's id and commit time, and the declared activity from the capture's
// per-session state. It never calls factory and never reads tool output.
// A commit is real when HEAD changed within the last two minutes; a failed
// or dry-run commit leaves HEAD alone and stays silent. Silent too in solo
// mode, outside factory mode, without a usable token, and for a commit it
// already announced.
const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const { execFileSync } = require("node:child_process");
const { loadConfig } = require("./lib/config");
const { factoryMode, factoryToken, tokenState } = require("./lib/factory");
const { commandOf, segments } = require("./lib/shell");
const { readSessionState } = require("./lib/capture-state");

const FRESH_MS = 2 * 60000;
const GIT_COMMIT = /(^|\s)git(\.exe)?(\s+-[Cc]\s+\S+)*\s+commit\b/;

function commits(cmd) {
  if (/--dry-run\b/.test(cmd)) return false;
  if (segments(cmd).some((seg) => GIT_COMMIT.test(seg))) return true;
  return /git-cut(\.sh)?\b/.test(cmd) && /(^|\s)-m(\s|$)/.test(cmd);
}

// HEAD as { sha, at } in the hook's cwd, or null outside a repository.
function head(cwd) {
  try {
    const out = execFileSync("git", ["-C", cwd, "log", "-1", "--format=%H %ct"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const [sha, secs] = out.trim().split(" ");
    return sha ? { sha, at: Number(secs) * 1000 } : null;
  } catch {
    return null;
  }
}

function firstTime(sessionId, sha) {
  const key = String(`${sessionId}-${sha}`).replace(/[^\w-]/g, "_").slice(0, 120);
  const marker = join(tmpdir(), `crew-closure-${key}`);
  if (existsSync(marker)) return false;
  writeFileSync(marker, "");
  return true;
}

function instruction(sha, declared, projectId) {
  const task = declared ? `The activity this session declared is ${declared}.` : "This session has no activity declared.";
  return `Crew factory notice: commit ${sha.slice(0, 7)} just landed. ${task} ` +
    "In your reply, ask the programmer one question, in their language: does this commit close the task? " +
    "Ask nothing about hours yet, and ask nothing at all when you already closed this task and proposed its hours in this session. " +
    "If they say no, ask nothing more: intermediate commits never ask about hours. If they say yes, follow the task-closure skill: " +
    "close the activity (factory MCP update_activity, action complete); read my_week with that activityId; " +
    "in one message propose the task title, its package (cost center) and the person hours of today's record, " +
    "rounded up to the next 5 minutes, at least 10 minutes, and ask them to confirm or adjust. " +
    "Show agentHours as data from the capture: never ask about them or change them. " +
    "If no activity exists for the work, propose in that same message the task to create, with its title and package, and create it " +
    `only on their yes: create_activity in project ${projectId}, under the story or requirement in progress, without assignee. ` +
    "The package is the parent item's; when it has none, the person picks one, and \"No planificado\" is the fallback. " +
    "Load only a number the programmer gave or confirmed: update_time on the day's record, or log_time when the day has none.";
}

function notice(input, now = Date.now()) {
  const cwd = input.cwd || process.cwd();
  const cfg = loadConfig(cwd);
  if (!cfg || cfg.mode === "solo" || !factoryMode(cfg) || !input.session_id) return null;
  const token = factoryToken();
  if (!token || tokenState(token, now) === "revoked") return null;
  if (!commits(commandOf(input.tool_input))) return null;
  const tip = head(cwd);
  if (!tip || now - tip.at > FRESH_MS || !firstTime(input.session_id, tip.sha)) return null;
  return instruction(tip.sha, readSessionState(input.session_id).blockTaskId || null, cfg.factory.projectId);
}

if (require.main === module) {
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
}
module.exports = { commits };
