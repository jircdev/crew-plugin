#!/usr/bin/env node
// Connects this machine to factory without copying a token by hand.
//
//   node factory-login.js login | status | logout
//
// login: opens factory in the browser, where the person reads what capture
// records and approves. Factory hands a one-time code (never the token) to a
// listener on 127.0.0.1; crew trades code + PKCE verifier for the token and
// stores it owner-only. Everything printed here ends up in the chat, so the
// token is never printed.
const http = require("node:http");
const os = require("node:os");
const { randomBytes, createHash, timingSafeEqual } = require("node:crypto");
const { execFile } = require("node:child_process");
const { loadConfig } = require("../hooks/lib/config");
const { resolveFactory } = require("../hooks/lib/factory-env");
const { factoryToken, saveToken, forgetToken, request, crewHome } = require("../hooks/lib/factory");

const TIMEOUT_MS = Number(process.env.CREW_LOGIN_TIMEOUT_MS) || 5 * 60000;
const HTTP_MS = 10000;
const b64url = (buf) => buf.toString("base64url");
// factory answers {success, data} on success and {status:false, error:{message}}
// on failure; error messages carry no secrets, so they are relayed as-is.
const unwrap = (body) => {
  try { const json = JSON.parse(body); return (json && json.data) || json || {}; } catch { return {}; }
};
const errorOf = (body) => {
  try { return (JSON.parse(body).error || {}).message || ""; } catch { return ""; }
};
const DONE_PAGE = (ok) => `<!doctype html><meta charset="utf-8"><title>crew</title>` +
  `<p style="font:16px system-ui;margin:3em">${ok ? "Listo. Ya podés volver a Claude." :
    "No se conectó. Podés cerrar esta pestaña."}</p>`;

function openBrowser(url) {
  if (process.env.CREW_LOGIN_NO_BROWSER) return;
  const [cmd, args] = process.platform === "win32" ? ["rundll32", ["url.dll,FileProtocolHandler", url]]
    : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  execFile(cmd, args, () => { /* the printed URL is the fallback */ });
}

const sameSecret = (a, b) => {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && timingSafeEqual(x, y);
};

// One callback, then close. Accepts the form POST and, as fallback, a GET
// with the same fields in the query. onListen receives the port.
function waitForCallback(state, onListen) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const port = server.address().port;
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      if (url.pathname !== "/callback" || req.headers.host !== `127.0.0.1:${port}`) {
        return res.writeHead(404).end();
      }
      let body = "";
      req.on("data", (d) => { body += d; if (body.length > 4096) req.destroy(); });
      req.on("end", () => {
        const fields = req.method === "POST" ? new URLSearchParams(body) : url.searchParams;
        if (!sameSecret(fields.get("state"), state)) return res.writeHead(400).end();
        const denied = fields.get("error") === "denied" || !fields.get("code");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(DONE_PAGE(!denied));
        server.close();
        clearTimeout(timer);
        resolve(denied ? null : fields.get("code"));
      });
    });
    const timer = setTimeout(() => { server.close(); reject(new Error("timed out waiting for the approval")); }, TIMEOUT_MS);
    server.listen(0, "127.0.0.1", () => onListen(server.address().port));
  });
}

async function login(target) {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const state = b64url(randomBytes(32));
  const device = `${os.hostname()} (${process.platform})`.slice(0, 80);
  let callback;
  const port = await new Promise((resolve) => { callback = waitForCallback(state, resolve); });
  const page = `${target.web}/my-hours/connect?` +
    new URLSearchParams({ port: String(port), state, challenge, device }).toString();
  console.log(`Opening factory (${target.name}) to approve this machine. If the browser does not open, use:\n${page}\n`);
  openBrowser(page);
  const code = await callback;
  if (!code) {
    return fail("the connection was declined in factory. If the page said capture is blocked, the formal notice " +
      "is missing: pedile a Gestión el aviso formal");
  }
  const res = await request("POST", `${target.api}/access-tokens/loopback/exchange`, null, { code, verifier }, HTTP_MS);
  const data = unwrap(res.body);
  if (res.status < 200 || res.status >= 300 || !data.token) {
    const why = res.status === 429 ? "too many attempts, wait a minute" : errorOf(res.body) || `HTTP ${res.status}`;
    return fail(`factory did not complete the connection (${why}). Run the login again`);
  }
  const file = saveToken(data.token);
  console.log(`Connected to factory ${target.name}. Token stored owner-only in ${file}` +
    (data.expiresAt ? `; it expires on ${String(data.expiresAt).slice(0, 10)}.` : "."));
  if (process.env.FACTORY_TOKEN) console.log("Note: FACTORY_TOKEN is set in this environment and takes precedence over the stored token.");
  return 0;
}

async function status(target) {
  const token = factoryToken();
  if (!token) return say(`Not connected to factory ${target.name}. Run /crew:factory login.`);
  try {
    const res = await request("GET", `${target.api}/access-tokens/self`, token, undefined, HTTP_MS);
    if (res.status === 401) return say(`The token on this machine was rejected by factory ${target.name} (revoked or expired). Run /crew:factory login.`);
    const data = unwrap(res.body);
    if (res.status >= 200 && res.status < 300) {
      return say(`Connected to factory ${target.name} as ${data.personName || "this person"}` +
        (data.expiresAt ? `, token expires on ${String(data.expiresAt).slice(0, 10)}.` : "."));
    }
    return say(`A token is stored, but factory ${target.name} answered HTTP ${res.status} when checking it.`);
  } catch {
    return say(`A token is stored, but factory ${target.name} (${target.api}) did not answer.`);
  }
}

async function logout(target) {
  const token = factoryToken();
  if (!token) return say("This machine has no factory token.");
  let revoked = false;
  try {
    const res = await request("DELETE", `${target.api}/access-tokens/self`, token, undefined, HTTP_MS);
    revoked = (res.status >= 200 && res.status < 300) || res.status === 401;
  } catch { /* offline: local copy still goes */ }
  forgetToken();
  console.log(revoked ? "Disconnected: the token was revoked in factory and removed from this machine."
    : "Removed the token from this machine. Factory could not confirm the revocation; revoke it in factory: Mis horas → Conectar con la IA.");
  if (process.env.FACTORY_TOKEN) console.log("FACTORY_TOKEN is still set in this environment; unset it to stop using it.");
  return 0;
}

function say(line) { console.log(line); return 0; }
function fail(reason) { console.log(`Not connected: ${reason}.`); return 1; }

async function main() {
  const action = process.argv[2] || "status";
  const cfg = loadConfig(process.cwd());
  const target = resolveFactory(cfg && cfg.factory);
  if (target.warning) console.log(`Note: ${target.warning}.`);
  const run = { login, status, logout }[action];
  if (!run) return say(`Usage: /crew:factory login | status | logout (state lives in ${crewHome()}).`);
  try {
    return await run(target);
  } catch (error) {
    return fail(error.message);
  }
}

if (require.main === module) main().then((code) => { process.exitCode = code; });
module.exports = { waitForCallback };
