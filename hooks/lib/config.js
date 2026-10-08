// Shared crew.json reader for every guard AND for the roles. Single rule: no
// crew.json (or an unreadable/invalid one) means exact v0.19.1 behavior —
// loadConfig returns null and each guard falls back to inferring by structure,
// with quality enforcing. The new defaults (advise, metrics on, ...) are NOT
// plugin defaults: they exist only as values scripts/init-project.sh writes
// explicitly into the crew.json of new projects. Absent fields stay
// legacy-equivalent.
//
// EVOLUTION INVARIANTS — this file is the single authorized interpreter of
// crew.json. Break one of these and every project's behavior silently shifts:
//
//   1. An existing key never changes meaning. New meaning ⇒ new key.
//   2. New fields are optional, and no default may GRANT a capability. A
//      default that lets an agent start a server or claim a verdict is the
//      plugin authorizing itself.
//   3. During a migration, normalize() accepts the old and the new shape for
//      ONE minor version; retiring the old shape is a mandatory changelog
//      entry — the same contract that governs a retired alias.
//   4. There is no per-section version. Evolution is additive by construction:
//      an absent field equals the previous behavior. A genuinely global break
//      would need a schemaVersion for the WHOLE file, never for one section.
//   5. An unknown `kind` is treated as absent, never as a blocking error, and
//      is recorded in that section's `unknown` list so the role can NAME it
//      instead of degrading in silence.
//   6. No field may be honored by a role if normalize() does not transport it.
//      One interpretation of the contract, never two.
const { readFileSync, existsSync } = require("node:fs");
const { join, dirname } = require("node:path");

const QUALITY_MODES = new Set(["advise", "enforce", "off"]);
// Enums exist ONLY where a role must know HOW to consume the capability.
// Everything else (viewports, check kinds, source kinds) is a free label: the
// plugin defines the shape, never the catalogue of tools or form factors.
const REGISTRY_KINDS = new Set(["storybook", "doc", "none"]);
const CAPTURE_KINDS = new Set(["browser", "playwright"]);
// baseline: what a role falls back to when `memory` is silent on the question
// at hand. The kind is closed because consuming a skill (load it) and consuming
// a document (read it) are different actions; the ref is the project's, never
// the plugin's — declaring nothing here means no fallback taste exists, which
// is a declaration too.
const BASELINE_KINDS = new Set(["skill", "doc"]);

// testing.e2e.kind is deliberately a FREE label, unlike registry/capture/
// baseline: whatever the harness is called, the action a role takes is the
// same — write the scenario as a spec under `specs`. The plugin never
// catalogues test tools; naming Playwright here would be the plugin choosing
// the stack through the back door.

// Walk up from startDir looking for crew.json (stops at filesystem root or
// after 30 levels). Returns the parsed, normalized config object, or null.
function loadConfig(startDir) {
  try {
    let dir = startDir;
    for (let i = 0; i < 30 && dir; i++) {
      const candidate = join(dir, "crew.json");
      if (existsSync(candidate)) return normalize(readFileSync(candidate, "utf8"));
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // fall through — unreadable config behaves like no config
  }
  return null;
}

function str(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// design: absent ⇒ null (never {}), so "declared nothing" and "declared an
// empty object" stay distinguishable. Every branch either yields a usable
// capability or drops it and records why in `unknown`.
function normalizeDesign(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const unknown = [];

  const sources = (Array.isArray(raw.sources) ? raw.sources : [])
    .filter((s) => s && typeof s === "object" && str(s.ref))
    .map((s) => ({ kind: str(s.kind) || "unlabeled", ref: str(s.ref) }));

  let baseline = null;
  if (raw.baseline && typeof raw.baseline === "object") {
    const kind = str(raw.baseline.kind);
    const ref = str(raw.baseline.ref);
    if (kind && BASELINE_KINDS.has(kind) && ref) baseline = { kind, ref };
    else if (kind && BASELINE_KINDS.has(kind)) unknown.push("baseline.ref=missing");
    else if (kind) unknown.push(`baseline.kind=${kind}`);
  }

  let registry = null;
  if (raw.registry && typeof raw.registry === "object") {
    const kind = str(raw.registry.kind);
    if (kind && REGISTRY_KINDS.has(kind)) registry = { kind, ref: str(raw.registry.ref) };
    else if (kind) unknown.push(`registry.kind=${kind}`);
  }

  let runtime = null;
  if (raw.runtime && typeof raw.runtime === "object") {
    const url = str(raw.runtime.url);
    const launch = str(raw.runtime.launch);
    // url and launch are SEPARATE permissions: connecting to something already
    // running is inspection; running a launch profile executes a command on the
    // user's machine. Presence of `runtime` grants neither on its own.
    if (url || launch) runtime = { url, launch };
  }

  let capture = null;
  if (raw.capture && typeof raw.capture === "object") {
    const kind = str(raw.capture.kind);
    if (kind && CAPTURE_KINDS.has(kind)) {
      const viewports = (Array.isArray(raw.capture.viewports) ? raw.capture.viewports : [])
        .map(str)
        .filter(Boolean);
      capture = { kind, viewports, out: str(raw.capture.out) };
    } else if (kind) unknown.push(`capture.kind=${kind}`);
  }

  const checks = (Array.isArray(raw.checks) ? raw.checks : [])
    .filter((c) => c && typeof c === "object" && str(c.cmd))
    .map((c) => ({ kind: str(c.kind) || "unlabeled", cmd: str(c.cmd) }));

  return {
    memory: str(raw.memory),
    baseline,
    sources,
    registry,
    runtime,
    capture,
    checks,
    unknown,
  };
}

// testing: what this project can verify, and with what. Declaring it is what
// turns the verification block of a work item into a closure gate — a project
// that declares nothing keeps the pre-0.23 behavior exactly.
function normalizeTesting(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const unknown = [];

  let e2e = null;
  if (raw.e2e && typeof raw.e2e === "object") {
    const kind = str(raw.e2e.kind);
    const specs = str(raw.e2e.specs);
    // A harness with nowhere to write the spec cannot be acted on: the role
    // would have to invent a location, which is the guessing this whole
    // mechanism exists to prevent.
    if (kind && specs) e2e = { kind, specs };
    else if (kind) unknown.push("e2e.specs=missing");
  }

  const commands = (Array.isArray(raw.commands) ? raw.commands : [])
    .filter((c) => c && typeof c === "object" && str(c.cmd))
    .map((c) => ({ kind: str(c.kind) || "unlabeled", cmd: str(c.cmd) }));

  return { guide: str(raw.guide), e2e, commands, unknown };
}

function normalize(raw) {
  try {
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
    if (!parsed || typeof parsed !== "object") return null;
    return {
      mode: parsed.mode === "solo" ? "solo" : "team",
      metrics: parsed.metrics === true,
      quality: QUALITY_MODES.has(parsed.quality) ? parsed.quality : "enforce",
      ceilings:
        parsed.ceilings && typeof parsed.ceilings === "object" ? parsed.ceilings : {},
      // State, not policy: which plugin version last configured this project.
      // Nobody interprets it to decide behavior — delete it and the only thing
      // lost is the pending-configuration notice.
      configuredWith: str(parsed.configuredWith),
      design: normalizeDesign(parsed.design),
      testing: normalizeTesting(parsed.testing),
    };
  } catch {
    return null; // invalid JSON ⇒ legacy behavior, never block
  }
}

// Convenience for PreToolUse guards: resolve the config that governs an
// edited file (walk up from the file), falling back to the session cwd.
function configFor(filePath, cwd) {
  const fromFile = filePath ? loadConfig(dirname(filePath)) : null;
  if (fromFile) return fromFile;
  return cwd ? loadConfig(cwd) : null;
}

module.exports = { loadConfig, configFor };
