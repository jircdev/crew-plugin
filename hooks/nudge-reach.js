// PreToolUse hook on Edit/Write: the change must not grow past the request in
// silence (execution craft, "Map the reach").
//
// - The first code file a session edits sets its area (`packages/<name>`,
//   `apps/<name>`, ... or the top folder). An edit in another area gets one
//   notice per area: announce the extra reach to the person before going on.
// - A path under crew.json `scope.protected` asks the person first, once per
//   path and session: those are the rules a change must not cross unannounced.
//
// It sees areas, never call graphs: inside one area the reach is the craft's to
// map. Documentation, work records and tests never count. Works in solo and team;
// `quality: "off"` silences it. Anything unexpected fails open.
const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { join, dirname } = require("node:path");
const { tmpdir } = require("node:os");
const { createHash } = require("node:crypto");
const { configFor } = require("./lib/config");
const { findRoot, globMatch } = require("./lib/ceilings");

const CONTAINERS = new Set(["packages", "apps", "services", "libs", "modules", "plugins"]);
// Docs, work records and the change's own tests are never reach.
const NOT_CODE = /(^|\/)(docs|work|\.claude|\.crew|tests?|__tests__|spec|e2e)\/|\.(test|spec)\.\w+$|\.(md|mdx|txt)$/i;

function areaOf(rel) {
  const segs = rel.split("/");
  if (segs.length === 1) return "(root)";
  return CONTAINERS.has(segs[0]) && segs.length > 2 ? `${segs[0]}/${segs[1]}` : segs[0];
}

function emit(output) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", ...output } }));
}

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^\s+/, "")); // \s covers a byte-order mark
  if (input.tool_name !== "Edit" && input.tool_name !== "Write") process.exit(0);
  const file = ((input.tool_input && input.tool_input.file_path) || "").replace(/\\/g, "/");
  if (!file) process.exit(0);
  const cfg = configFor(file, input.cwd);
  if (cfg && cfg.quality === "off") process.exit(0);
  const root = (findRoot(dirname(file)) || "").replace(/\\/g, "/");
  if (!root || !file.toLowerCase().startsWith(root.toLowerCase() + "/")) process.exit(0);
  const rel = file.slice(root.length + 1);
  if (NOT_CODE.test(rel)) process.exit(0);

  const key = createHash("sha256").update(`${input.session_id || ""}|${root}`).digest("hex").slice(0, 16);
  const stateFile = join(tmpdir(), `crew-reach-${key}.json`);
  const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) : { areas: [], asked: [] };
  const save = () => writeFileSync(stateFile, JSON.stringify(state));

  const guarded = ((cfg && cfg.scope && cfg.scope.protected) || []).find((g) => globMatch(g, rel));
  if (guarded && !state.asked.includes(rel)) {
    state.asked.push(rel);
    save();
    emit({ permissionDecision: "ask", permissionDecisionReason:
      `Crew reach: ${rel} is protected in crew.json (scope.protected: ${guarded}). Edit it only if this rule ` +
      `is part of what was asked, or the person accepted the extra reach; never to make a behavior pass.` });
    process.exit(0);
  }

  const area = areaOf(rel);
  if (!state.areas.length) { state.areas.push(area); save(); process.exit(0); }
  if (state.areas.includes(area)) process.exit(0);
  const first = state.areas[0];
  state.areas.push(area);
  save();
  emit({ additionalContext:
    `Crew reach notice: this edit moves from ${first} into ${area}. If the request did not name ${area}, ` +
    `stop and tell the person in one line before editing: what they asked, what it implies here, what you ` +
    `recommend (execution craft, "Map the reach"). Go on once they accept, or when it was already part of the request.` });
} catch {
  // Fail open: a guard bug must never block legitimate work.
}
process.exit(0);
