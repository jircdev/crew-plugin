// The repository's identity as factory stores it, read from its git remote.
// A remote can carry a credential (https://user:token@host/...), so only the
// provider and the repository path ever leave this module: userinfo, port,
// query, fragment and any path past the repository are dropped here, before
// anything reaches the network, the chat, crew.json or a log.
const { execFileSync } = require("node:child_process");

// GitHub ids are owner/name; any other host keeps host/path.
function reduceRemote(raw) {
  const text = String(raw || "").trim();
  let host;
  let path;
  const scp = text.match(/^(?:[^@/\s]+@)?([^:/\s]+):(?!\/)(.+)$/);
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) {
    let url;
    try { url = new URL(text); } catch { return null; }
    host = url.hostname;
    path = url.pathname;
  } else if (scp) {
    host = scp[1];
    path = scp[2];
  } else {
    return null;
  }
  // GitLab-style pages (`/-/tree/main`) start past the repository.
  const all = path.replace(/[?#].*$/, "").split("/").filter(Boolean);
  const segments = all.includes("-") ? all.slice(0, all.indexOf("-")) : all;
  if (segments.length) segments[segments.length - 1] = segments[segments.length - 1].replace(/\.git$/i, "");
  if (!host || segments.length < 2 || segments.some((s) => !/^[\w.-]+$/.test(s) || /^\.+$/.test(s))) return null;
  host = host.toLowerCase();
  if (host === "github.com" || host === "www.github.com") {
    return { provider: "github", repo: `${segments[0]}/${segments[1]}`.toLowerCase() };
  }
  return { provider: "other", repo: `${host}/${segments.join("/")}`.toLowerCase() };
}

function git(cwd, args) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], windowsHide: true }).trim();
  } catch {
    return "";
  }
}

// { provider, repo } from `origin`, or from the only remote when there is
// one; { none: true } without a remote; { unrecognized: true } when the
// remote cannot be reduced (its text is never returned).
function repoIdentity(cwd) {
  const names = git(cwd, ["remote"]).split("\n").map((n) => n.trim()).filter(Boolean);
  const name = names.includes("origin") ? "origin" : names.length === 1 ? names[0] : null;
  if (!name) return { none: true };
  const reduced = reduceRemote(git(cwd, ["remote", "get-url", name]));
  return reduced || { unrecognized: true };
}

module.exports = { reduceRemote, repoIdentity };
