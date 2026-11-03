#!/usr/bin/env node
// Reads the hours this repository recorded (estimation tables and work logs)
// and prepares them for factory's MCP tools: the requirements to save with
// upsert_requirement and the batches for import_repo_hours.
//
//   node factory-repo-hours.js [--out <file>]
//
// It only reads and writes a local JSON file; it sends nothing. The agent
// then calls the tools in the order of docs/en/factory.md: find the project,
// save each requirement, run import_repo_hours as a dry run, show the person
// the result, and apply only after they say yes. Factory decides whose each
// row is from the author email; the file never names a person.
const { writeFileSync, mkdirSync } = require("node:fs");
const { join, dirname } = require("node:path");
const { tmpdir } = require("node:os");
const { repoIdentity } = require("./lib/repo-remote");
const { readRepository } = require("./lib/repo-hours-read");
const { git } = require("./lib/repo-hours");

// The tool takes up to 200 files per call and 200 rows per file.
const FILES_PER_CALL = 200;

function batches(files) {
  const out = [];
  for (let i = 0; i < files.length; i += FILES_PER_CALL) out.push(files.slice(i, i + FILES_PER_CALL));
  return out;
}

function summary(read, identity, out) {
  const rows = read.files.flatMap((f) => f.rows);
  const byAuthor = new Map();
  for (const r of rows) byAuthor.set(r.authorEmail, (byAuthor.get(r.authorEmail) || 0) + 1);
  const lines = [
    `Repository ${identity.repo}: ${read.requirements.length} work item(s) with an estimation table, ` +
      `${read.files.filter((f) => f.kind === "work_log").length} work log(s) with a duration.`,
    `${rows.length} timed row(s) to send, by commit author:`,
    ...[...byAuthor.entries()].sort((a, b) => b[1] - a[1]).map(([email, n]) => `  ${email}: ${n}`),
  ];
  if (read.notes.uncommitted) lines.push(`${read.notes.uncommitted} row(s) left out: not committed yet, so they have no author.`);
  if (read.notes.offsetGuessed) lines.push(`${read.notes.offsetGuessed} row(s) had no time zone; this machine's zone was used.`);
  lines.push(`Prepared for factory in ${out}`);
  return lines.join("\n");
}

function main(argv, cwd = process.cwd()) {
  const root = git(cwd, ["rev-parse", "--show-toplevel"]).trim();
  if (!root) {
    console.log("This folder is not a git repository: there is no author to read.");
    return 1;
  }
  const identity = repoIdentity(root);
  if (!identity.provider) {
    console.log("This repository has no remote factory can read, so it cannot be matched to a project.");
    return 1;
  }
  const read = readRepository(root, identity.repo);
  const commit = git(root, ["rev-parse", "HEAD"]).trim() || null;
  const at = argv.indexOf("--out");
  const out = at >= 0 && argv[at + 1] ? argv[at + 1] : join(tmpdir(), `crew-repo-hours-${identity.repo.replace(/[^\w.-]+/g, "_")}.json`);
  const payload = {
    provider: identity.provider,
    repo: identity.repo,
    commit,
    requirements: read.requirements,
    batches: batches(read.files).map((files) => ({ provider: identity.provider, repo: identity.repo, commit, files })),
  };
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(summary(read, identity, out));
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { main };
