// Factory mode helpers shared by the capture hook, the guards, metrics and
// the login command. The crew.json block is interpreted in factory-env.js;
// this file only consumes the normalized shape. The token is personal: it
// comes from the environment or the user's home, never from crew.json or the
// repository, and creating it is the person's consent to capture.
const fs = require("node:fs");
const { join } = require("node:path");
const os = require("node:os");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { resolveFactory } = require("./factory-env");

// CREW_HOME exists so tests never touch the real ~/.crew.
function crewHome() {
  return process.env.CREW_HOME || join(os.homedir(), ".crew");
}

const tokenFile = () => join(crewHome(), "factory-token");
const rejectedFile = () => join(crewHome(), "factory-token.rejected");
const fingerprint = (token) => createHash("sha256").update(token).digest("hex");

function factoryMode(cfg) {
  return !!(cfg && cfg.factory && cfg.factory.projectId);
}

function factoryApi(cfg) {
  return resolveFactory(cfg && cfg.factory).api;
}

function factoryToken() {
  const fromEnv = (process.env.FACTORY_TOKEN || "").trim();
  if (fromEnv) return fromEnv;
  try {
    return fs.readFileSync(tokenFile(), "utf8").trim() || null;
  } catch {
    return null;
  }
}

// Owner-only file: 0600 on POSIX; on Windows the ACL drops inheritance and
// grants the current user alone.
function saveToken(token) {
  fs.mkdirSync(crewHome(), { recursive: true });
  const file = tokenFile();
  fs.writeFileSync(file, `${token}\n`, { mode: 0o600 });
  if (process.platform === "win32") {
    execFileSync("icacls", [file, "/inheritance:r", "/grant:r", `${os.userInfo().username}:F`],
      { stdio: "ignore" });
  } else {
    fs.chmodSync(file, 0o600);
  }
  fs.rmSync(rejectedFile(), { force: true });
  return file;
}

function forgetToken() {
  fs.rmSync(tokenFile(), { force: true });
  fs.rmSync(rejectedFile(), { force: true });
}

// A 401 means the token was revoked or expired: revoking is how a person
// pauses capture. Only its fingerprint is kept, so a new token resumes it.
function markRejected(token) {
  fs.mkdirSync(crewHome(), { recursive: true });
  fs.writeFileSync(rejectedFile(), fingerprint(token));
}

function isRejected(token) {
  try {
    return fs.readFileSync(rejectedFile(), "utf8").trim() === fingerprint(token);
  } catch {
    return false;
  }
}

// Capture is paused by the person (CREW_CAPTURE=off, no token, a revoked
// token), or by the project (capture: false).
function captureToken(cfg) {
  if (!factoryMode(cfg)) return null;
  if ((process.env.CREW_CAPTURE || "").toLowerCase() === "off") return null;
  if (cfg.factory.capture === false) return null;
  const token = factoryToken();
  return token && !isRejected(token) ? token : null;
}

// One request with a hard timeout. Resolves { status, body, type, headers }
// or throws on network failure / timeout, so callers can tell "server said
// no" from "no server".
async function request(method, url, token, payload, timeoutMs, extraHeaders = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        ...(payload === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const body = await res.text();
    return { status: res.status, body, type: res.headers.get("content-type") || "", headers: res.headers };
  } finally {
    clearTimeout(timer);
  }
}

const postJson = (url, token, payload, timeoutMs, extraHeaders) =>
  request("POST", url, token, payload, timeoutMs, extraHeaders);

module.exports = {
  crewHome, factoryMode, factoryApi, factoryToken, saveToken, forgetToken,
  markRejected, isRejected, captureToken, request, postJson,
};
