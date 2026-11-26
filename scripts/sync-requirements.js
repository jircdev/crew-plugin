#!/usr/bin/env node
// Requirement files reach factory when they enter a commit — no agent has to
// remember. In a repository whose crew.json declares `factory`, every
// docs/requirements/**/NNN-*.md of the commit is loaded (or updated) as a
// factory requirement with its milestones, both estimates and its plan status,
// and its `**Factory activity:**` link is written into the commit and the file.
//
//   node sync-requirements.js            the pre-commit step (its own line in
//                                        .git/hooks/pre-commit, lib/requirement-hook.js)
//   node sync-requirements.js --session  at session start: keep that line in
//                                        place and retry what waits
//
// Exit 1 stops the commit: a requirement factory refused, one without a link
// on a machine that cannot sign in, or one carrying a secret. Factory not
// answering never stops it: the file is queued and retried.
// CREW_REQUIREMENT_SYNC=off turns the step off on this machine.
const fs = require("node:fs");
const { join } = require("node:path");
const { loadConfig } = require("../hooks/lib/config");
const { factoryMode } = require("../hooks/lib/factory");
const { mainCheckout } = require("../hooks/lib/main-checkout");
const { repoIdentity } = require("./lib/repo-remote");
const { secrets } = require("./lib/sec-rules");
const { isRequirement, skipped, payloadOf } = require("./lib/requirement-payload");
const { send, tokenFor, withLink, linkedTo } = require("./lib/requirement-sync");
const { topLevel, stagedPaths, stagedText, stage } = require("./lib/requirement-git");
const { ensureHook } = require("./lib/requirement-hook");
const queue = require("./lib/requirement-queue");

const SIGN_IN = "Run /crew:factory login, then commit again.";
const say = (line) => process.stderr.write(`${line}\n`);

function context(cwd) {
  const root = topLevel(cwd);
  const cfg = root ? loadConfig(root) : null;
  if (!root || !factoryMode(cfg)) return null;
  if ((process.env.CREW_REQUIREMENT_SYNC || "").toLowerCase() === "off") return null;
  const repoRoot = mainCheckout(root) || root;
  const identity = repoIdentity(repoRoot);
  const repository = identity.provider ? { provider: identity.provider, repo: identity.repo } : undefined;
  return { root, cfg, repoRoot, repository };
}

async function load(ctx, rel, text) {
  const auth = tokenFor(ctx.cfg);
  if (!auth.token) return { outcome: "signin", detail: auth.problem };
  return send(ctx.cfg, auth.token, payloadOf({ root: ctx.repoRoot, rel, text, factory: ctx.cfg.factory, repository: ctx.repository }));
}

function linkWorkingFile(root, rel, id) {
  const file = join(root, rel);
  if (!fs.existsSync(file)) return false;
  const text = fs.readFileSync(file, "utf8");
  if (linkedTo(text) === id) return false;
  fs.writeFileSync(file, withLink(text, id));
  return true;
}

// Files a previous commit left waiting, outside the ones entering this commit.
async function retryQueued(ctx, except = new Set()) {
  const linked = [];
  for (const entry of queue.waitingIn(ctx.root)) {
    if (except.has(entry.path)) continue;
    const file = join(ctx.root, entry.path);
    if (!fs.existsSync(file)) { queue.remove(ctx.root, entry.path); continue; }
    const text = fs.readFileSync(file, "utf8");
    if (skipped(text)) { queue.remove(ctx.root, entry.path); continue; }
    const result = await load(ctx, entry.path, text);
    if (result.outcome === "unreachable" || result.outcome === "signin") break;
    queue.remove(ctx.root, entry.path);
    if (result.outcome === "loaded" && linkWorkingFile(ctx.root, entry.path, result.activityId)) linked.push(entry.path);
    if (result.outcome === "refused") say(`crew: factory refused ${entry.path} (${result.detail}); it left the queue.`);
  }
  return linked;
}

async function commitStep(ctx) {
  const paths = stagedPaths(ctx.root);
  if (paths === null) return 0; // the quality gate already reports a listing that fails
  const staged = paths.filter(isRequirement);
  try { await retryQueued(ctx, new Set(staged)); } catch { /* the queue waits for the next try */ }
  const problems = [];
  for (const rel of staged) {
    const text = stagedText(ctx.root, rel);
    if (text === null || skipped(text)) continue;
    const leak = secrets(rel, text)[0];
    if (leak) { problems.push(`${rel}:${leak.line} — ${leak.what}. Take it out of the file: nothing was sent to factory.`); continue; }
    const result = await load(ctx, rel, text);
    const linked = linkedTo(text);
    if (result.outcome === "loaded") {
      queue.remove(ctx.root, rel);
      if (linked !== result.activityId && stage(ctx.root, rel, withLink(text, result.activityId))) linkWorkingFile(ctx.root, rel, result.activityId);
      say(`crew: ${rel} → factory activity ${result.activityId} (${result.data.status}).`);
    } else if (result.outcome === "unreachable" || (result.outcome === "signin" && linked)) {
      queue.add(ctx.root, rel, text);
      say(`crew: ${rel} was NOT loaded into factory (${result.detail}). The commit goes on; the file is queued and retried at the next commit and session start.`);
    } else if (result.outcome === "signin") {
      problems.push(`${rel} has no factory link and ${result.detail}. ${SIGN_IN}`);
    } else {
      problems.push(`${rel}: factory refused it (${result.detail}).`);
    }
  }
  if (!problems.length) return 0;
  say("crew requirement gate: a requirement enters a commit only with its factory link.\n");
  for (const p of problems) say(`  ${p}`);
  say("\nTo keep one file out of factory (a sensitive subject), add `- **Factory:** skip` to its header.\n" +
    "Guide: docs/en/factory.md#requirements-load-at-commit in the crew plugin.");
  return 1;
}

// Session start: nothing printed unless something changed or needs the person.
async function sessionStep(ctx) {
  const gate = ensureHook(ctx.repoRoot, join(__dirname, ".."));
  if (gate.action === "wrote" || gate.action === "appended") console.log(`- Crew added its requirement step to ${gate.path}: requirement files load into factory when committed.`);
  if (gate.action === "manual") console.log(`- Requirement files load into factory at commit, and this repository's commit hook does not run that step yet. ${gate.why}`);
  const linked = await retryQueued(ctx);
  for (const rel of linked) console.log(`- ${rel} reached factory after waiting in the queue; its link is written in the file: commit it.`);
  const waiting = queue.waitingIn(ctx.root).length;
  if (waiting) console.log(`- ${waiting} requirement file(s) of this repository still wait to be loaded into factory; the next commit or session retries.`);
}

async function main(argv) {
  const session = argv.includes("--session");
  let cwd = process.cwd();
  if (session) {
    try { cwd = JSON.parse(fs.readFileSync(0, "utf8").trim()).cwd || cwd; } catch { /* run by hand */ }
  }
  const ctx = context(cwd);
  if (!ctx) return 0;
  if (!session) return commitStep(ctx);
  try { await sessionStep(ctx); } catch { /* a session never fails on this */ }
  return 0;
}

if (require.main === module) main(process.argv.slice(2)).then((code) => process.exit(code), () => process.exit(0));

module.exports = { commitStep, sessionStep, context };
