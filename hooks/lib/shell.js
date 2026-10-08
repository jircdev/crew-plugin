// Shell command reading for the shell guard. Text heuristics, deliberately
// conservative: quoted strings are blanked before matching so a commit message
// that mentions "--no-verify" is not read as the flag, and every finding names
// the exact fragment it matched so a false positive is easy to see and argue.

// The command a host hands the hook: Claude passes a string; Codex variants may
// pass an argv array (["bash", "-lc", "…"]).
function commandOf(toolInput) {
  const c = toolInput && (toolInput.command ?? toolInput.cmd ?? toolInput.script);
  if (Array.isArray(c)) return c.map(String).join(" ");
  return typeof c === "string" ? c : "";
}

// Blank the contents of quoted strings and heredoc bodies, keep their length.
function unquote(cmd) {
  return cmd
    .replace(/<<-?\s*['"]?(\w+)['"]?[\s\S]*?\n\1\b/g, (m) => " ".repeat(m.length))
    .replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, (m) => `'${" ".repeat(Math.max(0, m.length - 2))}'`);
}

// Simple commands of a pipeline/list, on the unquoted text.
function segments(cmd) {
  return unquote(cmd).split(/&&|\|\||[;|\n]|\$\(|`/).map((s) => s.trim()).filter(Boolean);
}

// Evasion of the git hooks crew relies on (pre-commit quality gate).
function hookBypass(cmd) {
  for (const seg of segments(cmd)) {
    if (!/(^|\s)git(\.exe)?\s/.test(" " + seg)) continue;
    if (/core\.hookspath/i.test(seg)) return "core.hooksPath";
    if (/\s--no-verify\b/.test(seg)) return "--no-verify";
    // `git commit -n` is --no-verify; on push, -n means --dry-run.
    if (/\scommit\b/.test(seg) && /\s-[a-zA-Z]*n[a-zA-Z]*(\s|$)/.test(seg.replace(/^.*?\scommit\b/, " "))) return "git commit -n";
  }
  return null;
}

const DESTRUCTIVE = [
  [/\brm\s+(-[a-zA-Z]*[rR][a-zA-Z]*\s+-?[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*[rR]|-[a-zA-Z]*[rR][a-zA-Z]*f)/, "recursive forced delete"],
  [/\bRemove-Item\b(?=.*-Recurse)(?=.*-Force)/i, "recursive forced delete"],
  [/\b(rd|rmdir)\s+\/s\b/i, "recursive delete"],
  [/\bgit\s+reset\s+--hard\b/, "git reset --hard"],
  [/\bgit\s+clean\s+-[a-zA-Z]*f/, "git clean -f"],
  [/\bgit\s+push\b.*\s(--force(-with-lease)?|-f)\b/, "forced push"],
  [/\bgit\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/, "discard all working-tree changes"],
  [/\bgit\s+branch\s+-D\b/, "forced branch delete"],
  [/\bdrop\s+(table|database|schema)\b/i, "DROP statement"],
  [/\btruncate\s+table\b/i, "TRUNCATE statement"],
];

// Destructive operations: matched on the raw command (SQL lives inside quotes).
function destructive(cmd) {
  const hits = [];
  for (const [rx, label] of DESTRUCTIVE) {
    const text = /statement/.test(label) ? cmd : unquote(cmd);
    if (rx.test(text) && !hits.includes(label)) hits.push(label);
  }
  return hits;
}

module.exports = { commandOf, unquote, segments, hookBypass, destructive };
