// Extra doctor checks contributed by later capabilities (the SEC configuration
// scan, brownfield freshness). Each check is (root, cfg) => findings[], and a
// failing check reports itself instead of breaking the diagnosis.
const checks = [];

function register(check) {
  checks.push(check);
}

function run(root, cfg) {
  const out = [];
  for (const check of checks) {
    try {
      out.push(...check(root, cfg));
    } catch (error) {
      out.push({ severity: "important", what: "a doctor check could not run", evidence: String(error && error.message), action: "report it; the rest of the diagnosis is still valid" });
    }
  }
  return out;
}

module.exports = { register, run };
