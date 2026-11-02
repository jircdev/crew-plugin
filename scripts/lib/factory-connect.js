// What login and status need beyond the token itself: who the token belongs
// to, what happens to time queued on this machine, and which factory project
// the current repository is linked to. Everything printed from here reaches
// the chat, so it names the person and their own projects only.
const { request, storedMeta } = require("../../hooks/lib/factory");
const { callTool } = require("../../hooks/lib/factory-mcp");
const fs = require("node:fs");
const { join } = require("node:path");
const { activityDir, enqueue, flush, queuedCount, clearActivity, claimQueue, readIntervals } =
  require("../../hooks/lib/activity-queue");

const HTTP_MS = 10000;
// factory answers {success, data}; anything else unwraps to {}.
const unwrap = (body) => {
  try { const json = JSON.parse(body); return (json && json.data) || json || {}; } catch { return {}; }
};

// { person, name, projects }. `person` is factory's person id, from whoami;
// null when factory could not say (offline, or a profile without the MCP).
// A display name never stands in for it: two people can share one.
async function identify(target, token) {
  try {
    const me = await callTool(target.api, token, "whoami", {}, HTTP_MS);
    if (me && me.person && me.person.personId) {
      return { person: me.person.personId, name: me.person.name, projects: me.projects || [] };
    }
  } catch { /* fall back to /self for the name only */ }
  try {
    const res = await request("GET", `${target.api}/access-tokens/self`, token, undefined, HTTP_MS);
    const name = res.status >= 200 && res.status < 300 ? unwrap(res.body).personName : null;
    return { person: null, name, projects: null };
  } catch {
    return { person: null, name: null, projects: null };
  }
}

// Time held aside waits, with whose it is, for a login that can confirm it.
const heldFile = () => join(activityDir(), "held.jsonl");
const heldOwnerFile = () => join(activityDir(), "held-owner.json");
function readHeldOwner() {
  try { return JSON.parse(fs.readFileSync(heldOwnerFile(), "utf8")); } catch { return null; }
}

function holdQueue(owner) {
  const files = claimQueue(activityDir());
  const items = readIntervals(files.concat(fs.existsSync(heldFile()) ? [heldFile()] : []));
  fs.writeFileSync(heldFile(), items.map((i) => JSON.stringify(i)).join("\n") + "\n", { mode: 0o600 });
  fs.writeFileSync(heldOwnerFile(), JSON.stringify({ person: owner.person, api: owner.api }), { mode: 0o600 });
  for (const file of files) fs.rmSync(file, { force: true });
  return items.length;
}

function releaseHeld() {
  if (!fs.existsSync(heldFile())) return;
  enqueue(readIntervals([heldFile()]));
  fs.rmSync(heldFile(), { force: true });
  fs.rmSync(heldOwnerFile(), { force: true });
}

// Queued time leaves only for the person who captured it, on the factory it
// was captured for, and is discarded only when factory confirms someone else.
// Returns the sentence to print, or null with nothing queued.
async function adoptQueue(target, token, previous, person) {
  const owner = readHeldOwner() || previous;
  const pending = queuedCount() + (fs.existsSync(heldFile()) ? readIntervals([heldFile()]).length : 0);
  if (!pending) return null;
  if (!owner || !owner.person) {
    clearActivity();
    return `Discarded ${pending} queued intervals: this machine never recorded whose they were.`;
  }
  if (!person) {
    const held = holdQueue(owner);
    return `Kept ${held} queued intervals aside: factory could not confirm whose they are. ` +
      "The next login that confirms it sends them.";
  }
  if (owner.person !== person || owner.api !== target.api) {
    clearActivity();
    return `Discarded ${pending} queued intervals: they were captured for another account or another factory.`;
  }
  releaseHeld();
  await flush(target.api, token, Date.now());
  const left = queuedCount();
  return left ? `Sent the queued time; ${left} of ${pending} intervals are still waiting (factory did not take them yet).`
    : `Sent ${pending} intervals of time captured while the token was expired.`;
}

// The metadata a new token is stored with. A reconnection of the same person
// to the same factory keeps the original connection date.
function metaFor(target, data, person, previous) {
  const continues = previous && person && previous.person === person && previous.api === target.api;
  return {
    expiresAt: data.expiresAt || null,
    connectedAt: (continues && previous.connectedAt) || new Date().toISOString(),
    person,
    api: target.api,
  };
}

// One line about the current repository's link, for status.
function bindingLine(cfg, projects) {
  if (!cfg) return "This folder has no crew.json, so nothing here is linked to factory.";
  const f = cfg.factory || {};
  if (f.capture === false) return "This repository has factory capture turned off (crew.json: capture false).";
  if (!f.projectId) return "This repository is not linked to a factory project. Run /crew:factory link.";
  const project = (projects || []).find((p) => p.id === f.projectId);
  if (project) return `This repository is linked to the factory project ${project.name} (${f.projectId}).`;
  return projects ? `This repository is linked to project ${f.projectId}, which is not among your factory projects: ` +
    "its time arrives without a project. Run /crew:factory link to pick one of yours."
    : `This repository is linked to project ${f.projectId}.`;
}

module.exports = { identify, adoptQueue, metaFor, bindingLine, previousMeta: storedMeta, unwrap };
