// Machine-readable blocks of docs/DEVIATIONS.md (crew:exempt, crew:standard,
// crew:policy). One parser so every block shares the same comment grammar:
//
//   <rule>   # rationale · owner: julio · expires: 2027-03-31
//
// `owner:` and `expires:` are optional. A rule whose expiry date has passed is
// returned with `expired: true` and callers treat it as absent — an exception
// that outlived its date is no longer an exception, and /crew:doctor lists it.
const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseLine(raw, now = today()) {
  const line = raw.trim();
  if (!line) return null;
  const hash = line.indexOf("#");
  const rule = (hash === -1 ? line : line.slice(0, hash)).trim();
  const comment = hash === -1 ? "" : line.slice(hash + 1).trim();
  const owner = (comment.match(/\bowner:\s*([^·|,;]+?)\s*(?:[·|,;]|$)/i) || [])[1] || null;
  const expires = (comment.match(/\bexpires:\s*(\d{4}-\d{2}-\d{2})/i) || [])[1] || null;
  const reason = comment.replace(/\b(owner|expires):\s*[^·|,;]*/gi, "").replace(/[·|,;\s]+$/g, "").trim();
  return { raw: line, rule, reason, owner, expires, expired: !!(expires && expires < now) };
}

// All entries of the first `<!-- crew:<name>` block, or [] when absent.
function readBlock(root, name, now) {
  try {
    const file = join(root, "docs", "DEVIATIONS.md");
    if (!existsSync(file)) return [];
    const block = readFileSync(file, "utf8").match(new RegExp(`<!--\\s*crew:${name}\\s*\\n([\\s\\S]*?)-->`, "i"));
    if (!block) return [];
    return block[1].split(/\r?\n/).map((l) => parseLine(l, now)).filter((e) => e && e.rule);
  } catch {
    return [];
  }
}

module.exports = { readBlock, parseLine, today };
