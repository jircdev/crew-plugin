// Doctor check: the configuration security scan, mapped onto the findings
// scale (critical/high → blocking, medium → important, info → refinement).
// Accepted risks (crew:security block) are left out.
const { register } = require("./doctor-checks");

const MAP = { critical: "blocking", high: "blocking", medium: "important", info: "refinement" };

function security(root) {
  const { scan } = require("../sec-scan");
  return scan(root).findings.filter((f) => !f.accepted).map((f) => ({
    severity: MAP[f.severity],
    what: `security: ${f.what}`,
    evidence: `${f.rule} at ${f.file}${f.line ? `:${f.line}` : ""}`,
    action: f.fix,
  }));
}

register(security);
module.exports = { security };
