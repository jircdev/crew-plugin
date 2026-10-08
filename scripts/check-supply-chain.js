#!/usr/bin/env node
// Supply-chain hygiene for everything the plugin distributes. The role docs,
// skills and hooks are read by agents in other people's projects, so text that
// a human reviewer cannot see is an instruction channel nobody approved:
//
//   · bidi controls and invisible characters (zero-width, tag characters, BOM
//     mid-file) — the classic way to make reviewed text read differently to a
//     model than to a person;
//   · personal absolute paths (C:\Users\<name>, /home/<name>, /Users/<name>) —
//     they leak the maintainer's machine and never resolve anywhere else.
//
// No dependency scan: the plugin ships no npm or pip dependencies, so there is
// no lockfile to check against known-compromised versions. Exit 1 on findings.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
// Same list as scripts/package-plugin.js — what actually ships.
const SHIPPED = [".claude-plugin", ".codex-plugin", "agents", "commands", "skills", "standards",
  "templates", "hooks", "scripts", "integrations", "docs", "evals", "migrations.json", "README.md", "CHANGELOG.md"];
const TEXT = /\.(md|js|json|sh|py|txt|ya?ml)$/i;
const HIDDEN = /[\u202A-\u202E\u2066-\u2069\u200B-\u200F\u2060-\u2064\uFEFF\u{E0000}-\u{E007F}]/u;
const PERSONAL = /(?:[A-Za-z]:[\\/]+Users[\\/]+(?!<)[^\\/\s`'"<>]+|\/home\/(?!<)[a-z][^/\s`'"<>]*|\/Users\/(?!<)[A-Za-z][^/\s`'"<>]*)/;
// Placeholders that document a path shape rather than leak one.
const PLACEHOLDER = /(Users|home)[\\/]+(<[^>]+>|\{[^}]+\}|you|me|name|user|username|USER|USERNAME)\b/;

function files(entry) {
  const full = path.join(root, entry);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [full];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((d) =>
    d.name === "__pycache__" ? [] : files(path.join(entry, d.name)));
}

function scan(list = SHIPPED.flatMap(files)) {
  const findings = [];
  for (const file of list.filter((f) => TEXT.test(f))) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      const text = i === 0 ? line.replace(/^\uFEFF/, "") : line;
      const where = `${path.relative(root, file)}:${i + 1}`;
      const hidden = text.match(HIDDEN);
      if (hidden) findings.push(`${where} hidden or bidi character U+${hidden[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`);
      const personal = text.match(PERSONAL);
      if (personal && !PLACEHOLDER.test(personal[0])) findings.push(`${where} personal path ${personal[0]}`);
    });
  }
  return findings;
}

if (require.main === module) {
  const findings = scan();
  if (findings.length) {
    console.error(`Supply-chain hygiene: ${findings.length} finding(s)\n  ${findings.join("\n  ")}`);
    process.exit(1);
  }
  console.log("Supply-chain hygiene: no hidden characters or personal paths in shipped files.");
}
module.exports = { scan, HIDDEN, PERSONAL };
