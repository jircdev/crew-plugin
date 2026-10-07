// Which factory a machine talks to. crew.json picks the environment the team
// uses (prod unless it says otherwise); a person can point their own machine
// elsewhere without touching the shared file, so machine variables win.
// Precedence, highest first: CREW_FACTORY_URL → CREW_FACTORY_ENV → crew.json
// `url` → crew.json `environment` → prod.
// The web base (where the person approves a login) follows the same order,
// with CREW_FACTORY_WEB_URL / `web` as the explicit overrides.
const ENVIRONMENTS = {
  prod: { api: "https://api.factory.balearesgroup.com/api/v1", web: "https://factory.balearesgroup.com" },
  dev: { api: "https://api.dev.factory.balearesgroup.com/api/v1", web: "https://dev.factory.balearesgroup.com" },
};
const DEFAULT_ENV = "prod";

const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const trimSlash = (u) => u.replace(/\/+$/, "");

// The crew.json block, normalized. Declaring it with a projectId is the
// opt-in; the token never lives here (env or ~/.crew only).
function normalizeFactory(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const projectId = str(raw.projectId);
  const unknown = projectId ? [] : ["projectId=missing"];
  const environment = str(raw.environment);
  if (environment && !ENVIRONMENTS[environment]) unknown.push(`environment=${environment}`);
  return {
    projectId,
    environment,
    url: str(raw.url) ? trimSlash(str(raw.url)) : null,
    web: str(raw.web) ? trimSlash(str(raw.web)) : null,
    capture: raw.capture !== false,
    unknown,
  };
}

// Resolves { name, api, web } for this machine. An unknown environment name
// falls back to prod and is reported in `warning`.
function resolveFactory(factory, env = process.env) {
  const f = factory || {};
  const envName = str(env.CREW_FACTORY_ENV);
  const requested = envName || f.environment || DEFAULT_ENV;
  const name = ENVIRONMENTS[requested] ? requested : DEFAULT_ENV;
  const warning = name === requested ? null : `unknown factory environment "${requested}", using ${DEFAULT_ENV}`;
  const envUrl = str(env.CREW_FACTORY_URL);
  const envWeb = str(env.CREW_FACTORY_WEB_URL);
  const custom = envUrl || (!envName && f.url) || null;
  return {
    name: custom ? "custom" : name,
    api: custom ? trimSlash(custom) : ENVIRONMENTS[name].api,
    web: envWeb ? trimSlash(envWeb) : (!envName && f.web) || ENVIRONMENTS[name].web,
    warning,
  };
}

module.exports = { ENVIRONMENTS, normalizeFactory, resolveFactory };
