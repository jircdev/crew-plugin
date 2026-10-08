// Doctor check: an as-is spec (docs/as-is/*.md) is stale once any file it was
// read from changed after the commit it records. Read-only; needs git.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { register } = require("./doctor-checks");

function field(text, name) {
  return ((text.match(new RegExp(`^- \\*\\*${name}:\\*\\*\\s*(.+)$`, "mi")) || [])[1] || "").trim();
}

function stale(root) {
  const dir = path.join(root, "docs", "as-is");
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir).filter((n) => /\.md$/i.test(n) && !/^readme\.md$/i.test(n))) {
    const text = fs.readFileSync(path.join(dir, name), "utf8");
    const commit = field(text, "Commit");
    const files = field(text, "Files read").split(",").map((s) => s.trim().replace(/^`|`$/g, "")).filter(Boolean);
    const where = `docs/as-is/${name}`;
    if (!/^[0-9a-f]{7,40}$/i.test(commit) || !files.length) {
      out.push({ severity: "refinement", what: "an as-is spec records no commit or files", evidence: where, action: "add them so its freshness can be checked" });
      continue;
    }
    const diff = spawnSync("git", ["diff", "--name-only", commit, "--", ...files], { cwd: root, encoding: "utf8", windowsHide: true });
    if (diff.status !== 0) {
      out.push({ severity: "refinement", what: "an as-is spec's commit is not in this repository", evidence: `${where} (${commit})`, action: "re-extract it with /crew:adopt" });
      continue;
    }
    const changed = diff.stdout.split("\n").filter(Boolean);
    if (changed.length) {
      out.push({ severity: "important", what: "an as-is spec is stale", evidence: `${where}: ${changed.slice(0, 3).join(", ")}${changed.length > 3 ? ` +${changed.length - 3}` : ""} changed since ${commit.slice(0, 8)}`,
        action: "re-extract that capability with /crew:adopt, or mark the spec superseded" });
    }
  }
  return out;
}

register(stale);
module.exports = { stale };
