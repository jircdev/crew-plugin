// One requirement file → factory, and the link back into the file.
//
// What each answer means for the commit lives here:
//   · loaded      — factory took it; the file gets `**Factory activity:** <id>`.
//   · unreachable — no answer, a timeout, 408, 429, 5xx, or a factory without
//                   this entry yet (404): nothing wrong with the file, so the
//                   commit goes on and the file is queued.
//   · signin      — no token, or one factory no longer accepts.
//   · refused     — factory answered no (400, 403): the person fixes it.
// Messages carry the HTTP code and factory's own short reason, never the
// token, the body sent or the whole answer.
const { request, factoryToken, tokenState, otherFactory, factoryApi } = require("../../hooks/lib/factory");
const { factoryTaskId } = require("../../hooks/lib/activity-rules");

const TIMEOUT_MS = 8000;
const RETRY = new Set([408, 425, 429]);
const LINK_LINE = /^(\s*-\s+\*\*Factory (?:activity|task):\*\*).*$/im;
const HEADER_LINE = /^\s*-\s+\*\*[^*]+:\*\*/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function reasonOf(body) {
  try {
    const json = JSON.parse(body);
    const message = (json.error && json.error.message) || json.message || "";
    return String(message).replace(/\s+/g, " ").trim().slice(0, 200);
  } catch {
    return "";
  }
}

// The token this repository may send with, or why there is none.
function tokenFor(cfg, now = Date.now()) {
  const token = factoryToken();
  if (!token) return { problem: "this machine is not connected to factory" };
  if (otherFactory(cfg, token)) return { problem: "the token on this machine belongs to another factory" };
  if (tokenState(token, now) === "expired") return { problem: "the factory token on this machine expired" };
  return { token };
}

async function send(cfg, token, payload, timeoutMs = TIMEOUT_MS) {
  let res;
  try {
    res = await request("POST", `${factoryApi(cfg)}/activity/requirements`, token, payload, timeoutMs);
  } catch {
    return { outcome: "unreachable", detail: "factory did not answer" };
  }
  if (res.status >= 200 && res.status < 300) {
    let data = null;
    try { data = JSON.parse(res.body).data; } catch { /* handled below */ }
    if (data && UUID.test(String(data.activityId || ""))) return { outcome: "loaded", activityId: data.activityId.toLowerCase(), data };
    return { outcome: "unreachable", detail: "factory answered without an activity" };
  }
  if (res.status === 401) return { outcome: "signin", detail: "factory does not accept the token on this machine" };
  if (res.status >= 500 || RETRY.has(res.status)) return { outcome: "unreachable", detail: `factory answered HTTP ${res.status}` };
  // A factory deployed before this entry existed has no such route: the file
  // is fine and waits, as it does when factory is down.
  if (res.status === 404 || res.status === 405) return { outcome: "unreachable", detail: "this factory does not take requirements at commit yet" };
  const reason = reasonOf(res.body);
  return { outcome: "refused", detail: `HTTP ${res.status}${reason ? `: ${reason}` : ""}` };
}

// The text with its `- **Factory activity:** <id>` header line: an existing
// line is rewritten (one written by hand without an id included), otherwise
// the line goes after the last header bullet, before the first section.
function withLink(text, id) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  const firstSection = lines.findIndex((l) => /^##\s/.test(l));
  const end = firstSection < 0 ? lines.length : firstSection;
  const existing = lines.findIndex((l, i) => i < end && LINK_LINE.test(l));
  const line = `- **Factory activity:** ${id}`;
  if (existing >= 0) {
    lines[existing] = line;
    return lines.join(eol);
  }
  let last = -1;
  for (let i = 0; i < end; i += 1) if (HEADER_LINE.test(lines[i])) last = i;
  if (last >= 0) lines.splice(last + 1, 0, line);
  else {
    const title = lines.findIndex((l) => /^#\s/.test(l));
    lines.splice(title + 1, 0, "", line);
  }
  return lines.join(eol);
}

const linkedTo = (text) => factoryTaskId(text);

module.exports = { send, tokenFor, withLink, linkedTo, reasonOf, TIMEOUT_MS };
