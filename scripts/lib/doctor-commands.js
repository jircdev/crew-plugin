// Doctor subcommands that answer one question each, so no user ever has to run
// an internal script by path:
//   standard [<work-item-path>]  the effective standard of a path, or every
//                                work item that departs from its own
//   security [--user]            scan the agent configuration and file the
//                                dated report in docs/security/
const fs = require("node:fs");
const path = require("node:path");
const { resolve } = require("../../hooks/lib/standards");
const { problems } = require("../../hooks/lib/shape");
const { workItems } = require("../../hooks/lib/work-state");
const { describe } = require("../conformance");

const PLUGIN = path.resolve(__dirname, "..", "..");

function standard(root, target) {
  if (target) {
    const std = resolve(path.resolve(root, target), PLUGIN);
    return std ? describe(std) : `${target} is not a story or requirement under docs/stories or docs/requirements.`;
  }
  const lines = [];
  for (const file of workItems(root)) {
    const std = resolve(file, PLUGIN);
    const found = std ? problems(fs.readFileSync(file, "utf8"), std) : [];
    if (found.length) lines.push(`${path.relative(root, file).replace(/\\/g, "/")}\n  - ${found.join("\n  - ")}`);
  }
  return lines.length
    ? `${lines.length} work item(s) depart from their standard:\n\n${lines.join("\n\n")}\n\nBring each to the standard when it is next edited, or declare the departure in the crew:standard block of docs/DEVIATIONS.md.`
    : "Every work item follows its standard.";
}

function security(root, { user = false } = {}) {
  const { scan, markdown, writeReport } = require("../sec-scan");
  const result = scan(root, { user });
  const report = writeReport(root, result);
  return `${markdown(result)}\nReport filed: ${report}. Accepted risks go in the crew:security block of docs/DEVIATIONS.md.`;
}

module.exports = { standard, security };
