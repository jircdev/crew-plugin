// status and logout for /crew:factory: what this machine's token says, how
// much time waits on it, and which project the current repository feeds.
// Everything printed here reaches the chat: never the token.
const { factoryToken, forgetToken, request, tokenState, tokenMeta } = require("../../hooks/lib/factory");
const { clearActivity, queuedCount } = require("../../hooks/lib/activity-queue");
const { identify, bindingLine, unwrap } = require("./factory-connect");

const HTTP_MS = 10000;
const day = (iso) => String(iso).slice(0, 10);

function say(line) { console.log(line); return 0; }

async function status(target, cfg) {
  const code = await tokenStatus(target);
  const token = factoryToken();
  const pending = queuedCount();
  if (pending) console.log(`${pending} captured intervals are waiting on this machine to be sent.`);
  console.log(bindingLine(cfg, token ? (await identify(target, token)).projects : null));
  return code;
}

async function tokenStatus(target) {
  const token = factoryToken();
  if (!token) return say(`Not connected to factory ${target.name}. Run /crew:factory login.`);
  const meta = tokenMeta(token) || {};
  if (tokenState(token) === "expired") {
    return say(`The token on this machine expired on ${day(meta.expiresAt)}. Your time is still recorded here; ` +
      "run /crew:factory login to send it.");
  }
  try {
    const res = await request("GET", `${target.api}/access-tokens/self`, token, undefined, HTTP_MS);
    if (res.status === 401) return say(`The token on this machine was rejected by factory ${target.name} (revoked). Run /crew:factory login.`);
    const data = unwrap(res.body);
    if (res.status >= 200 && res.status < 300) {
      return say(`Connected to factory ${target.name} as ${data.personName || "this person"}` +
        (data.expiresAt ? `, token expires on ${day(data.expiresAt)}.` : "."));
    }
    return say(`A token is stored, but factory ${target.name} answered HTTP ${res.status} when checking it.`);
  } catch {
    return say(`A token is stored, but factory ${target.name} (${target.api}) did not answer.`);
  }
}

// Logging out is the person pausing capture: the token and every interval
// still queued on this machine go.
async function logout(target) {
  const token = factoryToken();
  if (!token) return say("This machine has no factory token.");
  let revoked = false;
  try {
    const res = await request("DELETE", `${target.api}/access-tokens/self`, token, undefined, HTTP_MS);
    revoked = (res.status >= 200 && res.status < 300) || res.status === 401;
  } catch { /* offline: local copy still goes */ }
  forgetToken();
  clearActivity();
  console.log(revoked ? "Disconnected: the token was revoked in factory and removed from this machine."
    : "Removed the token from this machine. Factory could not confirm the revocation; revoke it in factory: Mis horas → Conectar con la IA.");
  if (process.env.FACTORY_TOKEN) console.log("FACTORY_TOKEN is still set in this environment; unset it to stop using it.");
  return 0;
}

module.exports = { status, logout };
