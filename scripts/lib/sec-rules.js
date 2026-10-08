// Rules of the crew configuration scan, owned by security-compliance. Pure
// functions over file text: no network, nothing executed, secrets masked
// before they leave this module. Severity: critical > high > medium > info,
// never averaged into a grade — an average hides the critical one.
const { HIDDEN } = require("../check-supply-chain");

const SECRETS = [
  [/\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/, "API key (sk-)"],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, "GitHub token"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\bxox[abpr]-[A-Za-z0-9-]{10,}/, "Slack token"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/"(?:[A-Za-z_]*(?:api[_-]?key|token|secret|password|passwd))"\s*:\s*"(?!\$\{)[^"\s]{12,}"/i, "credential literal"],
];

function mask(text) {
  const tail = text.replace(/[^A-Za-z0-9]/g, "").slice(-4);
  return `…${tail}`;
}

const finding = (rule, severity, file, line, what, fix) => ({ rule, severity, file, line, what, fix });

function secrets(file, text) {
  const out = [];
  text.split("\n").forEach((l, i) => {
    for (const [rx, label] of SECRETS) {
      const m = l.match(rx);
      if (m) out.push(finding("SEC-SECRET", "critical", file, i + 1, `${label} in plain text (${mask(m[0])})`,
        "move it to the environment or a secret store, reference it as ${VAR}, and rotate it: it has been on disk"));
    }
  });
  return out;
}

function instructions(file, text) {
  const out = [];
  text.split("\n").forEach((l, i) => {
    const h = l.match(HIDDEN);
    if (h) out.push(finding("SEC-HIDDEN", "high", file, i + 1, `hidden or bidi character U+${h[0].codePointAt(0).toString(16).toUpperCase()}`,
      "remove it: a reviewer cannot see what the model reads"));
    if (/\b(curl|wget|iwr|Invoke-WebRequest)\b[^\n|]*\|\s*(ba|z)?sh\b/i.test(l)) {
      out.push(finding("SEC-PIPE-SHELL", "high", file, i + 1, "instructs piping a download into a shell", "pin and review the script instead; never pipe a URL into a shell"));
    }
    if (/\b(ignore (all |any )?(previous|prior) instructions|you (are|have been) (pre-?)?(approved|authori[sz]ed)|skip (the )?(hooks|guards))\b/i.test(l)) {
      out.push(finding("SEC-INJECTION", "medium", file, i + 1, "text addressed to the agent that claims authority or asks to skip controls",
        "confirm a human wrote it on purpose; instructions belong to the human and the project's rules"));
    }
  });
  return [...out, ...secrets(file, text)];
}

function json(text) {
  try { return JSON.parse(text.replace(/^\uFEFF/, "")); } catch { return null; }
}

function settings(file, text) {
  const s = json(text);
  if (!s) return [];
  const out = [];
  const p = s.permissions || {};
  if ((p.defaultMode || s.defaultMode) === "bypassPermissions") out.push(finding("SEC-BYPASS", "critical", file, 0, "permissions default to bypassPermissions", "remove it; grant narrow allow rules instead"));
  if (s.disableAllHooks === true) out.push(finding("SEC-HOOKS-OFF", "high", file, 0, "all hooks are disabled", "re-enable hooks; disable a single hook by name if one misbehaves"));
  for (const rule of p.allow || []) {
    if (/^(\*|Bash|Bash\(\*\)|Bash\(\*:\*\)|PowerShell|PowerShell\(\*\))$/.test(String(rule))) {
      out.push(finding("SEC-WILDCARD", "high", file, 0, `allow rule "${rule}" grants any shell command`, "allow specific commands, e.g. Bash(npm test)"));
    }
  }
  const deny = (p.deny || []).join(" ");
  if (p.allow && p.allow.length && !/\.env|\.ssh|secret/i.test(deny)) {
    out.push(finding("SEC-NO-DENY", "medium", file, 0, "no deny rule protects secrets (.env, ~/.ssh)", "add deny rules such as Read(./.env*) and Read(~/.ssh/**)"));
  }
  for (const [event, groups] of Object.entries(s.hooks || {})) {
    for (const g of groups || []) for (const h of g.hooks || []) {
      const cmd = String(h.command || "");
      if (/\b(curl|wget|nc|ncat)\b/.test(cmd)) out.push(finding("SEC-HOOK-NET", "high", file, 0, `${event} hook calls the network: ${cmd.slice(0, 60)}`, "a hook sees tool input; confirm the destination or remove it"));
      if (/2>\s*\/dev\/null|\|\|\s*true\b/.test(cmd)) out.push(finding("SEC-HOOK-SILENT", "medium", file, 0, `${event} hook silences its errors`, "let a failing hook fail visibly"));
    }
  }
  return [...out, ...secrets(file, text)];
}

function mcp(file, text) {
  const s = json(text);
  const servers = (s && (s.mcpServers || s.servers)) || {};
  const out = [];
  for (const [name, def] of Object.entries(servers)) {
    const args = (def.args || []).map(String);
    if (/^npx(\.cmd)?$/.test(String(def.command || "")) && args.includes("-y")) {
      const pkg = args.find((a) => !a.startsWith("-"));
      if (pkg && !/@\d/.test(pkg.replace(/^@[^/]+\//, ""))) out.push(finding("SEC-MCP-UNPINNED", "high", file, 0, `MCP server "${name}" runs npx -y ${pkg} without a pinned version`, "pin an exact version (pkg@1.2.3)"));
    }
  }
  return [...out, ...secrets(file, text)];
}

const READ_ONLY = /(^|[-_])(researcher|reviewer|auditor|explorer)([-_]|$)/i;
function agent(file, text) {
  const head = (text.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
  const name = (head.match(/^name:\s*(.+)$/m) || [])[1] || "";
  const tools = (head.match(/^tools:\s*(.+)$/m) || [])[1];
  const out = [];
  if (READ_ONLY.test(name) && (!tools || /\b(Write|Edit|Bash)\b/.test(tools))) {
    out.push(finding("SEC-AGENT-TOOLS", "medium", file, 0, `agent "${name}" reads as read-only but ${tools ? `has ${tools}` : "has unrestricted tools"}`, "restrict its tools to Read, Grep, Glob"));
  }
  return [...out, ...instructions(file, text)];
}

module.exports = { instructions, settings, mcp, agent, secrets, mask };
