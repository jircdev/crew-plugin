#!/usr/bin/env node
// Rebuilds the work time of this repository from local Claude Code
// transcripts, for the stretches live capture lost (an expired token, a repo
// that was not linked yet).
//
//   node factory-backfill.js [--since YYYY-MM-DD] [--send]
//
// By default it only shows a summary: hours and intervals per day, nothing
// else from the transcripts. --send queues and sends them; the agent adds it
// only after the person says yes in the chat. The same interval rules as live
// capture apply, ids are derived from session and stretch so a rerun never
// adds anything twice, and only time after the person connected (or the
// date they give) and inside factory's 45 days is considered.
const { createHash } = require("node:crypto");
const { basename } = require("node:path");
const { loadConfig, configDir } = require("../hooks/lib/config");
const { resolveFactory } = require("../hooks/lib/factory-env");
const { factoryToken, tokenMeta, tokenState } = require("../hooks/lib/factory");
const { applyEvent } = require("../hooks/lib/activity-rules");
const { enqueue, flush, sendable, queuedCount } = require("../hooks/lib/activity-queue");
const { transcriptFiles, readSessions, eventsOf } = require("./lib/transcripts");

const RETENTION_MS = 45 * 86400000 - 3600000;
// Factory adds up agent time without merging overlaps, so a stretch that live
// capture already sent would count twice. Sending opens when factory counts
// agent time once per session (see docs/requirements/factory-onboarding).
const SEND_READY = false;

// A UUID-shaped id derived from what identifies the stretch.
function derivedId(sessionId, kind, from, to) {
  const h = createHash("sha256").update(`crew-backfill:${sessionId}:${kind}:${from}:${to}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function rebuild(root, projectId, since, now) {
  const intervals = [];
  const sessions = readSessions(transcriptFiles(since), root, since);
  for (const [sessionId, records] of sessions) {
    const ctx = { sessionId, projectId, source: "backfill", blocks: false, newId: (kind, from, to) => derivedId(sessionId, kind, from, to) };
    let state = {};
    for (const event of eventsOf(records, root)) {
      const step = applyEvent(state, event, event.at, ctx);
      state = step.state;
      intervals.push(...step.intervals);
    }
  }
  return { sessions: sessions.size, intervals: intervals.filter((i) => sendable(i, now)) };
}

const hours = (ms) => (ms / 3600000).toFixed(1);
const localDay = (iso) => new Date(iso).toLocaleDateString("en-CA");

function summary(intervals) {
  const days = new Map();
  for (const i of intervals) {
    const d = days.get(localDay(i.startedAt)) || days.set(localDay(i.startedAt), { human: 0, agent: 0, n: 0 }).get(localDay(i.startedAt));
    d[i.kind] += Date.parse(i.endedAt) - Date.parse(i.startedAt);
    d.n += 1;
  }
  const lines = ["| Day | Your time (h) | Agent time (h) | Intervals |", "|---|---|---|---|"];
  for (const [day, d] of [...days].sort()) lines.push(`| ${day} | ${hours(d.human)} | ${hours(d.agent)} | ${d.n} |`);
  return lines.join("\n");
}

// Queues the rebuilt intervals and sends them with the live queue.
async function send(intervals, api, token, now = Date.now()) {
  enqueue(intervals);
  await flush(api, token, now);
  return queuedCount();
}

function floorOf(args, token, now) {
  const flag = args.indexOf("--since");
  const given = flag >= 0 ? Date.parse(`${args[flag + 1]}T00:00:00`) : NaN;
  const connected = Date.parse((tokenMeta(token) || {}).connectedAt);
  const from = !Number.isNaN(given) ? given : connected;
  return Number.isNaN(from) ? null : Math.max(from, now - RETENTION_MS);
}

async function main() {
  const args = process.argv.slice(2);
  const dir = configDir(process.cwd());
  const cfg = dir && loadConfig(dir);
  if (!cfg || !cfg.factory || !cfg.factory.projectId) return say("This repository is not linked to factory. Run /crew:factory link first.", 1);
  if (cfg.factory.capture === false) return say("This repository has factory capture turned off (crew.json: capture false).", 1);
  const token = factoryToken();
  if (!token || tokenState(token) === "revoked") return say("This machine is not connected to factory. Run /crew:factory login first.", 1);
  const now = Date.now();
  const since = floorOf(args, token, now);
  if (since === null) {
    return say("This machine does not know when you connected to factory. Pass --since YYYY-MM-DD with the first day " +
      "you agreed to capture; factory accepts at most the last 45 days.", 1);
  }
  const target = resolveFactory(cfg.factory);
  const { sessions, intervals } = rebuild(dir, cfg.factory.projectId, since, now);
  console.log(`Time rebuilt for ${basename(dir)} → factory project ${cfg.factory.projectId} (factory ${target.name}), ` +
    `since ${new Date(since).toLocaleDateString("en-CA")}: ${intervals.length} intervals from ${sessions} sessions.`);
  if (intervals.length) console.log(`\n${summary(intervals)}\n`);
  if (!args.includes("--send")) return say("Nothing was sent. Review the days above; sending needs your explicit yes.", 0);
  if (!SEND_READY) {
    return say("Sending is closed in this version: factory still counts agent time twice where live capture already " +
      "sent it. It opens once factory counts agent time once per session.", 1);
  }
  const left = await send(intervals, target.api, token, now);
  return say(left ? `Queued ${intervals.length} intervals; ${left} are still waiting for factory.` : `Sent ${intervals.length} intervals.`, 0);
}

function say(line, code) { console.log(line); return code; }

if (require.main === module) main().then((code) => { process.exitCode = code; });
module.exports = { rebuild, derivedId, summary, send };
