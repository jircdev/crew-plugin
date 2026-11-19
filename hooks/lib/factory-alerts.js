// What is wrong with factory capture right now, in one fixed sentence. Shared
// by the session-start line the agent reads and the systemMessage the person
// sees, so both always say the same thing. Read-only: computing an alert
// never creates a file.
//
// Silent when the person has no token or paused capture (their choice), and
// in a repository that turned capture off. The texts carry no token, name or
// response body: only factory addresses, a date and how much time waits.
const { factoryToken, tokenState, tokenMeta, otherFactory } = require("./factory");
const { resolveFactory } = require("./factory-env");
const { readStatus, waitingWork } = require("./activity-queue");

const EXPIRING_MS = 7 * 86400000;
// The ones the person sees. unreachable and unavailable fix themselves and
// keep the time queued, so only the agent hears about them.
const HUMAN = new Set(["rejected", "expired", "expiring", "no-person", "not-linked", "other-factory"]);
// Time is piling up on this machine and only a login sends it: these repeat
// on every prompt until fixed.
const LOUD = new Set(["rejected", "expired"]);

function duration(ms) {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "less than a minute";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
}

function waiting() {
  const work = waitingWork();
  return work.count ? `${duration(work.ms)} of captured work (${work.count} intervals) is waiting on this machine. ` : "";
}

// A factory address comes from crew.json, which a cloned repository writes:
// it reaches the agent only when it is a plain web address.
function shown(api, fallback) {
  try {
    const url = new URL(api);
    if ((url.protocol === "https:" || url.protocol === "http:") && /^[\w.:/-]+$/.test(api)) return api;
  } catch { /* not an address */ }
  return fallback;
}

function text(key, cfg, meta) {
  const api = shown(resolveFactory(cfg.factory).api, "this repository's factory");
  const tokenApi = shown(meta.api, "another factory");
  return {
    "not-linked": "this repository is not linked to a factory project, so its time is not captured. " +
      "Run `/crew:factory link`, or set `\"factory\": { \"capture\": false }` in crew.json to silence this.",
    "other-factory": `this repository sends its time to ${api}, but this machine is connected to ${tokenApi}, ` +
      "so nothing is captured here. Point this repository's crew.json `factory.environment` at the factory you " +
      "connected to, or run `/crew:factory login` from here to connect this machine to this one.",
    rejected: `factory no longer accepts this machine's token, so nothing reaches factory. ${waiting()}` +
      "Run `/crew:factory login` to send it and resume.",
    expired: `this machine's factory token expired, so nothing reaches factory. ${waiting()}` +
      "Run `/crew:factory login` to send it.",
    expiring: `this machine's factory token expires on ${String(meta.expiresAt).slice(0, 10)}. ` +
      "Run `/crew:factory login` before then to keep capture running.",
    "no-person": "factory has no person record for this token's user; captured time stays queued until Gestión links one.",
    unreachable: `factory (${api}) did not answer; captured time stays queued on this machine for up to 45 days.`,
    unavailable: `factory (${api}) answered with an error; captured time stays queued on this machine for up to 45 days.`,
  }[key];
}

function alertKey(cfg, token, now) {
  if (!cfg.factory || !cfg.factory.projectId) return "not-linked";
  if (otherFactory(cfg, token)) return "other-factory";
  const state = tokenState(token, now);
  if (state === "revoked") return "rejected";
  if (state === "expired") return "expired";
  const problem = readStatus().problem;
  if (problem === "no-person" || problem === "unreachable" || problem === "unavailable") return problem;
  const expires = Date.parse((tokenMeta(token) || {}).expiresAt);
  return !Number.isNaN(expires) && expires - now < EXPIRING_MS ? "expiring" : null;
}

// { key, text, human, loud } or null.
function factoryAlert(cfg, now = Date.now()) {
  if (!cfg || (process.env.CREW_CAPTURE || "").toLowerCase() === "off") return null;
  if (cfg.factory && cfg.factory.capture === false) return null;
  const token = factoryToken();
  if (!token) return null;
  const key = alertKey(cfg, token, now);
  if (!key) return null;
  return { key, text: text(key, cfg, tokenMeta(token) || {}), human: HUMAN.has(key), loud: LOUD.has(key) };
}

// What the agent is told besides the alert: a loud one is the agent's cue to
// offer the fix it can run itself.
function agentHint(alert) {
  if (!alert || !alert.loud) return "";
  return " Offer the person, in one line, to run `/crew:factory login` for them now: it opens factory in the " +
    "browser and waits for their approval there. Run it only after their yes.";
}

module.exports = { factoryAlert, agentHint };
