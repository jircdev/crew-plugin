#!/usr/bin/env node
// Run the test commands the project declared in crew.json (`testing.commands`)
// and leave a RECEIPT per run, so "passing" in a verification table can point
// at an execution instead of a claim.
//
//   node scripts/verify.js [--kind <kind>] [--cwd <dir>] [--no-receipts]
//
// A receipt is docs/verification/receipts/<date>-<id>.json: the command, its
// exit code, start and finish times, the git HEAD and whether the tree was
// dirty, and the last lines of output. The id is a hash of that content, so a
// receipt cannot be renamed into a different run. Only declared commands run —
// this script never decides what the project's tests are.
// Exit 0 when every command passed (READY), 1 otherwise, 2 when nothing is declared.
const { spawnSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const { mkdirSync, writeFileSync } = require("node:fs");
const { join, resolve } = require("node:path");
const { loadConfig } = require("../hooks/lib/config");
const { findRoot } = require("../hooks/lib/ceilings");

const TAIL = 40;

function git(root, args) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
  return r.status === 0 ? r.stdout.trim() : null;
}

function receiptOf(root, entry, run, startedAt, finishedAt) {
  const output = `${run.stdout || ""}${run.stderr || ""}`.replace(/\r\n/g, "\n").split("\n");
  const body = {
    command: entry.cmd,
    kind: entry.kind,
    exitCode: run.status === null ? -1 : run.status,
    startedAt,
    finishedAt,
    head: git(root, ["rev-parse", "HEAD"]),
    dirty: (git(root, ["status", "--porcelain"]) || "") !== "",
    outputTail: output.slice(-TAIL).join("\n"),
  };
  const id = createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 12);
  return { id, ...body };
}

function main(argv) {
  const arg = (name) => { const i = argv.indexOf(name); return i === -1 ? null : argv[i + 1]; };
  const cwd = resolve(arg("--cwd") || process.cwd());
  const root = findRoot(cwd) || cwd;
  const cfg = loadConfig(cwd);
  const kind = arg("--kind");
  const commands = ((cfg && cfg.testing && cfg.testing.commands) || []).filter((c) => !kind || c.kind === kind);
  if (!commands.length) {
    console.log("NOT READY — no testing.commands declared in crew.json" + (kind ? ` for kind "${kind}"` : "") +
      ". Declare them (/crew:setup) before claiming a suite passes.");
    return 2;
  }
  const keep = !argv.includes("--no-receipts");
  const dir = join(root, "docs", "verification", "receipts");
  let failed = 0;
  for (const entry of commands) {
    const startedAt = new Date().toISOString();
    const run = spawnSync(entry.cmd, { cwd: root, shell: true, encoding: "utf8", windowsHide: true,
      timeout: 30 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
    const receipt = receiptOf(root, entry, run, startedAt, new Date().toISOString());
    if (receipt.exitCode !== 0) failed++;
    let where = "(not saved)";
    if (keep) {
      mkdirSync(dir, { recursive: true });
      where = join("docs", "verification", "receipts", `${startedAt.slice(0, 10)}-${receipt.id}.json`).replace(/\\/g, "/");
      writeFileSync(join(root, where), JSON.stringify(receipt, null, 2) + "\n");
    }
    console.log(`${receipt.exitCode === 0 ? "pass" : "FAIL"}  [${entry.kind}] ${entry.cmd}  exit ${receipt.exitCode}  receipt: ${receipt.id}  ${where}`);
  }
  console.log(failed ? `NOT READY — ${failed} of ${commands.length} declared command(s) failed.` : `READY — ${commands.length} declared command(s) passed.`);
  return failed ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { main, receiptOf };
