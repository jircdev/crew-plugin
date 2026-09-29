// Factory mode helpers shared by the capture hook, the guards and metrics.
// The crew.json block is interpreted in config.js; this file only consumes
// the normalized shape. The token is personal: it comes from the environment
// or the user's home, never from crew.json or the repository.
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const os = require("node:os");

// CREW_HOME exists so tests never touch the real ~/.crew.
function crewHome() {
  return process.env.CREW_HOME || join(os.homedir(), ".crew");
}

function factoryMode(cfg) {
  return !!(cfg && cfg.factory && cfg.factory.projectId);
}

function factoryToken() {
  const fromEnv = (process.env.FACTORY_TOKEN || "").trim();
  if (fromEnv) return fromEnv;
  try {
    return readFileSync(join(crewHome(), "factory-token"), "utf8").trim() || null;
  } catch {
    return null;
  }
}

// Capture is paused by the person (CREW_CAPTURE=off), by the project
// (capture: false), or simply by not having a token.
function captureToken(cfg) {
  if (!factoryMode(cfg)) return null;
  if ((process.env.CREW_CAPTURE || "").toLowerCase() === "off") return null;
  if (cfg.factory.capture === false) return null;
  return factoryToken();
}

// One POST with a hard timeout. Resolves { status, body, type } or throws on
// network failure / timeout, so callers can tell "server said no" from "no
// server".
async function postJson(url, token, payload, timeoutMs, extraHeaders = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...extraHeaders,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    return { status: res.status, body, type: res.headers.get("content-type") || "", headers: res.headers };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { crewHome, factoryMode, factoryToken, captureToken, postJson };
