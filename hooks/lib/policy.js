// What counts as RELAXING the controls an agent works under. Pure functions
// over the before/after text of a policy file; the guard decides what to do.
//
// Each relaxation has a stable key. A project that relaxes a control on
// purpose registers that key, with its rationale, in the crew:policy block of
// docs/DEVIATIONS.md:
//
//   <!-- crew:policy
//   crew.json quality      # moving to advise during the migration · owner: ana · expires: 2027-01-31
//   -->
const { basename } = require("node:path");

const QUALITY_RANK = { off: 0, advise: 1, enforce: 2 };

function json(text) {
  try {
    const v = JSON.parse(String(text || "").replace(/^\uFEFF/, ""));
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

function kindOf(path) {
  const p = String(path || "").replace(/\\/g, "/");
  if (basename(p) === "crew.json") return "crew";
  if (/(^|\/)\.claude\/settings(\.local)?\.json$/.test(p)) return "settings";
  if (/(^|\/)\.codex\/(config\.toml|hooks\.json)$/.test(p)) return "codex";
  return null;
}

function crewRelaxations(before, after) {
  const out = [];
  if (!before) return out; // a first crew.json grants nothing to relax
  if (!after) return ["crew.json removed"];
  const q = (v) => QUALITY_RANK[v && v.quality] ?? 2;
  if (q(after) < q(before)) out.push("crew.json quality");
  if (before.metrics === true && after.metrics !== true) out.push("crew.json metrics");
  if (before.testing && !after.testing) out.push("crew.json testing");
  if (before.mode !== "solo" && after.mode === "solo") out.push("crew.json mode");
  const bc = before.ceilings || {};
  const ac = after.ceilings || {};
  if (Object.keys(ac).some((k) => Number(ac[k]) > (Number(bc[k]) || 0) && bc[k] !== undefined)) out.push("crew.json ceilings");
  if (Object.keys(ac).some((k) => bc[k] === undefined)) out.push("crew.json ceilings");
  return [...new Set(out)];
}

function settingsRelaxations(before, after) {
  const b = before || {};
  const a = after || {};
  const out = [];
  if (a.disableAllHooks === true && b.disableAllHooks !== true) out.push("settings disableAllHooks");
  const mode = (s) => (s.permissions && s.permissions.defaultMode) || s.defaultMode;
  if (mode(a) === "bypassPermissions" && mode(b) !== "bypassPermissions") out.push("settings bypassPermissions");
  return out;
}

// Codex config is TOML; only the switches that turn hooks or approvals off.
function codexRelaxations(before, after) {
  const has = (t, rx) => rx.test(String(t || ""));
  const out = [];
  const off = /^\s*hooks\s*=\s*false|^\s*\[hooks\][\s\S]*?enabled\s*=\s*false/m;
  if (has(after, off) && !has(before, off)) out.push("codex hooks");
  const never = /approval_policy\s*=\s*"never"|sandbox_mode\s*=\s*"danger-full-access"/;
  if (has(after, never) && !has(before, never)) out.push("codex approvals");
  return out;
}

function relaxations(path, beforeText, afterText) {
  const kind = kindOf(path);
  if (kind === "crew") return crewRelaxations(json(beforeText), afterText === "" ? null : json(afterText) || {});
  if (kind === "settings") return settingsRelaxations(json(beforeText), json(afterText));
  if (kind === "codex") return codexRelaxations(beforeText, afterText);
  return [];
}

module.exports = { relaxations, kindOf };
