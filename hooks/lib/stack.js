// The crew.json `stack` section: where a project declares the knowledge of its
// own stack — conventions, tools, diagnostics — for the roles to load.
//
// The plugin carries method and never stack knowledge. A role deciding or
// implementing in an area loads what the project declared for it; with nothing
// declared it says so. Cataloguing frameworks here, or shipping a default
// spec, would be the plugin choosing the stack through the back door.
//
// `kind` is closed for the same reason as design.baseline: loading a skill and
// reading a document are different actions. `area` is a free label — the
// project names its own areas — and a spec without one applies to every area.
// Verification commands live in testing.commands and design.checks, one
// canonical place each.
const SPEC_KINDS = new Set(["skill", "doc"]);

const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

function normalizeStack(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const unknown = [];
  const specs = [];
  (Array.isArray(raw.specs) ? raw.specs : []).forEach((s, i) => {
    if (!s || typeof s !== "object") return;
    const kind = str(s.kind);
    const ref = str(s.ref);
    if (kind && !SPEC_KINDS.has(kind)) unknown.push(`specs[${i}].kind=${kind}`);
    else if (!kind) unknown.push(`specs[${i}].kind=missing`);
    else if (!ref) unknown.push(`specs[${i}].ref=missing`);
    else specs.push({ area: str(s.area) || "all", kind, ref });
  });
  return { specs, unknown };
}

module.exports = { normalizeStack };
