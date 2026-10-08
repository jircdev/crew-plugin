// Receipts written by scripts/verify.js, as read by the closure gate. A row is
// backed when its Status or Artifact cell cites `receipt: <id>` and a receipt
// with that id exists, hashes to that id (it was not edited after the run) and
// recorded exit code 0.
const { readdirSync, readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { createHash } = require("node:crypto");

function find(root, id) {
  const dir = join(root, "docs", "verification", "receipts");
  if (!existsSync(dir)) return null;
  const name = readdirSync(dir).find((f) => f.endsWith(`-${id}.json`));
  if (!name) return null;
  try {
    return JSON.parse(readFileSync(join(dir, name), "utf8"));
  } catch {
    return null;
  }
}

// Problem with the row's backing, or null when it is backed.
function unbacked(root, cells) {
  const text = `${cells[3] || ""} ${cells[4] || ""}`;
  const id = (text.match(/receipt:\s*([0-9a-f]{8,64})/i) || [])[1];
  if (!id) return "cites no receipt (`receipt: <id>` from scripts/verify.js)";
  const r = find(root, id.toLowerCase());
  if (!r) return `cites receipt ${id}, which does not exist under docs/verification/receipts/`;
  const { id: stored, ...body } = r;
  const hash = createHash("sha256").update(JSON.stringify(body)).digest("hex");
  if (!stored || !hash.startsWith(stored)) return `cites receipt ${id}, whose content no longer matches its id`;
  if (r.exitCode !== 0) return `cites receipt ${id}, which recorded exit code ${r.exitCode}`;
  return null;
}

module.exports = { unbacked, find };
