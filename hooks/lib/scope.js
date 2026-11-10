// crew.json `scope`: paths whose edit asks the person first (hooks/nudge-reach.js),
// the project's rules that a change must not cross unannounced. Globs relative to
// the project root, `**` crossing directories. Absent or malformed ⇒ none.
function normalizeScope(raw) {
  const list = raw && Array.isArray(raw.protected) ? raw.protected : [];
  return { protected: list.filter((g) => typeof g === "string" && g.trim()).map((g) => g.trim()) };
}

module.exports = { normalizeScope };
