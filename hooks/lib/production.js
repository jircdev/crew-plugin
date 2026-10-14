// Production reading for the production guard. Text heuristics: a command or an
// MCP call is "against production" when its text names production AND it talks
// to data or infrastructure. Either alone is not enough — `npm run build` and a
// Trello card titled "production bug" stay silent. Findings name the signal and
// the tool, never the matched text: a connection string can carry a password.

// "prod", "production", "producción", "prd" as a whole token (prod.db, --env=prod,
// db-prod-1); "products" or "prodigy" do not match.
const SIGNAL = /(?:^|[^a-z0-9])(prod|production|producci[oó]n|prd)(?=$|[^a-z0-9])/i;

// Clients and CLIs that reach a database, a cluster, a cloud or a remote host.
const TOOLS = new RegExp("(?:^|[\\s;&|(`'\"/=])(" + [
  "psql", "pgcli", "usql", "mysql", "mariadb", "mongo", "mongosh", "sqlcmd", "sqlite3", "redis-cli",
  "cqlsh", "snowsql", "clickhouse-client", "bq", "gcloud", "gsutil", "cloud-sql-proxy", "cloud_sql_proxy",
  "kubectl", "helm", "aws", "az", "firebase", "terraform", "pulumi", "prisma", "knex", "sequelize",
  "typeorm", "flyway", "liquibase", "alembic", "dbt", "supabase", "pscale", "wrangler", "fly", "flyctl",
  "railway", "vercel", "heroku", "ssh", "npx", "bunx", "pnpm", "yarn", "rails", "rake",
  "npm\\s+(?:run|exec)", "docker\\s+exec", "manage\\.py",
].join("|") + ")(?=$|[\\s;&|)`'\"])", "i");

// Environment selectors point any binary at production.
const ENV_FLAG = /(?:\b[A-Z_]*ENV(?:IRONMENT)?=|--env(?:ironment)?[= ])['"]?[\w.-]*?(prod|production)\b/i;

// MCP tools that query data or execute something; content tools (cards, mail) are out.
const MCP_EXEC = /sql|quer|database|db|postgres|mysql|mongo|bigquery|exec|run|deploy|kubectl|shell|command/i;

function shellProduction(cmd) {
  if (!cmd) return null;
  const env = cmd.match(ENV_FLAG);
  if (env) return { signal: env[1].toLowerCase(), tool: "environment selector" };
  const signal = cmd.match(SIGNAL);
  const tool = signal && cmd.match(TOOLS);
  return tool ? { signal: signal[1].toLowerCase(), tool: tool[1].replace(/\s+/g, " ") } : null;
}

function mcpProduction(toolName, toolInput) {
  if (!/^mcp__/.test(String(toolName || ""))) return null;
  const name = String(toolName).split("__").pop();
  if (!MCP_EXEC.test(name)) return null;
  const signal = JSON.stringify(toolInput || {}).match(SIGNAL);
  return signal ? { signal: signal[1].toLowerCase(), tool: toolName } : null;
}

module.exports = { shellProduction, mcpProduction };
