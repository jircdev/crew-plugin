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
// What login learned about the token: when it expires, when the person
// connected, who they are and which factory issued it. No secret here.
const metaFile = () => join(crewHome(), "factory-token.json");
// A 401 this close to the expiry is the expiry, not a revocation.
const EXPIRY_SKEW_MS = 5 * 60000;
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

// Owner-only: 0600 files and 0700 folders on POSIX; on Windows the ACL drops
// inheritance and grants the current user alone (a folder passes it on).
function restrictToOwner(path, folder = false) {
  if (process.platform === "win32") {
    const grant = `${os.userInfo().username}:${folder ? "(OI)(CI)F" : "F"}`;
    execFileSync("icacls", [path, "/inheritance:r", "/grant:r", grant], { stdio: "ignore" });
  } else {
    fs.chmodSync(path, folder ? 0o700 : 0o600);
  }
}

function writeOwnerOnly(file, text) {
  fs.mkdirSync(crewHome(), { recursive: true });
  fs.writeFileSync(file, text, { mode: 0o600 });
  restrictToOwner(file);
}

// meta: { expiresAt, connectedAt, person, api }, as login learned them.
function saveToken(token, meta = {}) {
  const file = tokenFile();
  writeOwnerOnly(file, `${token}\n`);
  writeOwnerOnly(metaFile(), JSON.stringify({ ...meta, fingerprint: fingerprint(token) }));
  fs.rmSync(rejectedFile(), { force: true });
  return file;
}

// The stored metadata, whichever token it describes (login compares owners).
function storedMeta() {
  try { return JSON.parse(fs.readFileSync(metaFile(), "utf8")); } catch { return null; }
}

// Metadata only counts for the token it was written with.
function tokenMeta(token) {
  const meta = storedMeta();
  return meta && token && meta.fingerprint === fingerprint(token) ? meta : null;
}

function forgetToken() {
  fs.rmSync(tokenFile(), { force: true });
  fs.rmSync(rejectedFile(), { force: true });
  fs.rmSync(metaFile(), { force: true });
}

// A 401 means the token was revoked or expired. Only its fingerprint is
// kept, so a new token resumes capture.
function markRejected(token) {
  writeOwnerOnly(rejectedFile(), fingerprint(token));
}

function isRejected(token) {
  try {
    return fs.readFileSync(rejectedFile(), "utf8").trim() === fingerprint(token);
  } catch {
    return false;
  }
}

function expired(token, now) {
  const at = Date.parse((tokenMeta(token) || {}).expiresAt);
  return !Number.isNaN(at) && now >= at - EXPIRY_SKEW_MS;
}

// "live", "expired" or "revoked". Factory answers 401 to both an expired and
// a revoked token; the expiry date login stored tells them apart. A token
// with no stored date (pasted by hand) that factory rejects counts as revoked.
function tokenState(token, now = Date.now()) {
  if (expired(token, now)) return "expired";
  return isRejected(token) ? "revoked" : "live";
}

// Capture is paused by the person (CREW_CAPTURE=off, no token, a revoked
// token), or by the project (capture: false). An expired token keeps
// recording locally, because the date it expires is one the person never
// chose; the next login sends what was kept.
function captureToken(cfg, now = Date.now()) {
  if (!factoryMode(cfg)) return null;
  if ((process.env.CREW_CAPTURE || "").toLowerCase() === "off") return null;
  if (cfg.factory.capture === false) return null;
  const token = factoryToken();
  return token && tokenState(token, now) !== "revoked" ? token : null;
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
  crewHome, factoryMode, factoryApi, factoryToken, saveToken, forgetToken, storedMeta, tokenMeta,
  restrictToOwner, markRejected, isRejected, tokenState, captureToken, request, postJson,
};
