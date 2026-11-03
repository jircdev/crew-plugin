// The step after /crew:factory login: registering factory's MCP server.
//
// The login stores the token in a file; it sets no FACTORY_TOKEN and registers
// no MCP server. The next step is printed with a command that reads the file,
// so the token never reaches the output (which ends up in the chat), and in
// the syntax of this platform's shell: in PowerShell "${FACTORY_TOKEN}" is a
// PowerShell variable, not the environment one, and registering with it
// stores an empty bearer that factory answers with 401.
//
// The agent may run the printed line, and the API address can come from a
// committed crew.json: an address outside a strict shape prints no command.

const SAFE_URL = /^https?:\/\/[A-Za-z0-9.-]+(:\d+)?(\/[A-Za-z0-9._~/-]*)?$/;
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);
const DOCS = "step 3 of the crew plugin's docs/en/factory.md";

function safeApi(api) {
  try {
    const url = new URL(api);
    if (url.username || url.password) return null;
    if (url.protocol !== "https:" && !(url.protocol === "http:" && LOOPBACK.has(url.hostname))) return null;
    return SAFE_URL.test(api) ? api.replace(/\/+$/, "") : null;
  } catch {
    return null;
  }
}

const psQuote = (s) => `'${String(s).replace(/'/g, "''")}'`;
const shQuote = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;

function mcpStep(api, file, platform = process.platform) {
  const base = safeApi(api);
  if (!base) return `To use factory's MCP tools in Claude Code, register the server as ${DOCS} describes.`;
  const windows = platform === "win32";
  const quote = windows ? psQuote : shQuote;
  const add = `claude mcp add --scope user --transport http factory ${quote(`${base}/mcp`)} --header`;
  const command = windows
    ? `$t = (Get-Content -Raw ${psQuote(file)}).Trim(); if ($t) { ${add} "Authorization: Bearer $t" }; Remove-Variable t`
    : `[ -s ${shQuote(file)} ] && ${add} "Authorization: Bearer $(tr -d '\\r\\n ' < ${shQuote(file)})"`;
  return "To use factory's MCP tools in Claude Code, register the server reading the token from that file " +
    `(${windows ? "PowerShell" : "bash"}; again after every login, because the registration keeps a copy):\n` +
    `claude mcp remove factory --scope user\n${command}`;
}

// Logout revokes the token, but a registered MCP server keeps its own copy.
const MCP_FORGET = "If factory's MCP server is registered in Claude Code, it keeps a copy of the token: " +
  "remove it with `claude mcp remove factory --scope user`.";

module.exports = { mcpStep, MCP_FORGET };
