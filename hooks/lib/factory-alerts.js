// What is wrong with factory capture right now, in one fixed sentence. Shared
// by the session-start line the agent reads and the systemMessage the person
// sees, so both always say the same thing. Read-only: computing an alert
// never creates a file, so a paused capture stays without local traces.
//
// Silent when the person has no token or paused capture (their choice), and
// in a repository that turned capture off. The texts carry no token, name or
// response body.
const { factoryToken, tokenState, tokenMeta } = require("./factory");
const { resolveFactory } = require("./factory-env");
const { readStatus } = require("./activity-queue");

const EXPIRING_MS = 7 * 86400000;
// The ones the person sees. unreachable and unavailable fix themselves and
// keep the time queued, so only the agent hears about them.
const HUMAN = new Set(["rejected", "expired", "expiring", "no-person", "not-linked"]);

function text(key, cfg, meta) {
  const api = resolveFactory(cfg.factory).api;
  return {
    "not-linked": "this repository is not linked to a factory project, so its time is not captured. " +
      "Run `/crew:factory link`, or set `\"factory\": { \"capture\": false }` in crew.json to silence this.",
    rejected: "factory rejected this machine's token (revoked), so capture is paused. Run `/crew:factory login` to resume it.",
    expired: "this machine's factory token expired. Your time is still recorded on this machine; " +
      "run `/crew:factory login` to send it.",
    expiring: `this machine's factory token expires on ${String(meta.expiresAt).slice(0, 10)}. ` +
      "Run `/crew:factory login` before then to keep capture running.",
    "no-person": "factory has no person record for this token's user; captured time stays queued until Gestión links one.",
    unreachable: `factory (${api}) did not answer; captured time stays queued on this machine for up to 45 days.`,
    unavailable: `factory (${api}) answered with an error; captured time stays queued on this machine for up to 45 days.`,
  }[key];
}

function alertKey(cfg, token, now) {
  if (!cfg.factory || !cfg.factory.projectId) return "not-linked";
  const state = tokenState(token, now);
  if (state === "revoked") return "rejected";
  if (state === "expired") return "expired";
  const problem = readStatus().problem;
  if (problem === "no-person" || problem === "unreachable" || problem === "unavailable") return problem;
  const expires = Date.parse((tokenMeta(token) || {}).expiresAt);
  return !Number.isNaN(expires) && expires - now < EXPIRING_MS ? "expiring" : null;
}

// { key, text, human } or null.
function factoryAlert(cfg, now = Date.now()) {
  if (!cfg || (process.env.CREW_CAPTURE || "").toLowerCase() === "off") return null;
  if (cfg.factory && cfg.factory.capture === false) return null;
  const token = factoryToken();
  if (!token) return null;
  const key = alertKey(cfg, token, now);
  return key ? { key, text: text(key, cfg, tokenMeta(token) || {}), human: HUMAN.has(key) } : null;
}

module.exports = { factoryAlert };
