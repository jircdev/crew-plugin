// Reads the work items of one plan folder (docs/requirements/<plan>/ or
// docs/stories/<feature>/) into what coordination needs: status, the items each
// one depends on, the paths its deliverable touches, and a declared blocker.
const fs = require("node:fs");
const path = require("node:path");

const DONE = /^(delivered|validated|closed|entregad[ao]|validad[ao]|cerrad[ao])$/i;

function header(text, name) {
  const m = text.split(/^##\s/m)[0].match(new RegExp(`^\\s*-\\s+\\*\\*(?:${name}):\\*\\*\\s*(.*)$`, "im"));
  return m ? m[1].trim() : "";
}

function section(text, name) {
  const parts = text.split(/^##\s+/m);
  const hit = parts.find((p) => new RegExp(`^(${name})\\s*$`, "im").test(p.split("\n")[0]));
  return hit ? hit.split("\n").slice(1).join("\n") : "";
}

// Dependencies are the work items linked from the Depends-on line, resolved
// relative to the item, so a dependency in another plan is followed too.
function dependencies(text, file) {
  const line = header(text, "Depends on|Depende de");
  return [...line.matchAll(/\]\(([^)]+\.md)\)/g)].map((m) => path.resolve(path.dirname(file), m[1]));
}

// Paths the deliverable names in backticks: what two parallel items must not share.
function touches(text) {
  const body = section(text, "Expected deliverable|Entregable esperado");
  return [...new Set([...body.matchAll(/`([^`\s]+)`/g)].map((m) => m[1].replace(/\/$/, ""))
    .filter((p) => p.includes("/") || /\.[a-z]{1,5}$/i.test(p)))];
}

function readItem(file) {
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const blocked = header(text, "Blocked|Bloqueado");
  return {
    file,
    id: path.basename(file).replace(/\.md$/, ""),
    title: ((text.match(/^#\s+(.+)$/m) || [])[1] || "").trim(),
    status: header(text, "Status|Estado").split(/\s*[—(]/)[0].trim(),
    depends: dependencies(text, file),
    touches: touches(text),
    blocked: blocked && !/^(—|-|none|ninguno)?$/i.test(blocked) ? blocked : "",
  };
}

function readPlan(dir) {
  return fs.readdirSync(dir).filter((f) => /^\d{3}-.+\.md$/.test(f)).sort().map((f) => readItem(path.join(dir, f)));
}

const isDone = (status) => DONE.test(status || "");

function statusOf(file) {
  try {
    return readItem(file).status;
  } catch {
    return "";
  }
}

module.exports = { readPlan, readItem, isDone, statusOf };
