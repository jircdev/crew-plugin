#!/usr/bin/env node
// Links the current repository to its factory project, found from the
// repository's git remote when factory knows it.
//
//   node factory-link.js                  resolve from the remote; list the person's projects when it cannot
//   node factory-link.js <projectId>      the manual pick: write it and register the repository on it
//   node factory-link.js --request-access ask for access to the project that holds this repository
//   node factory-link.js --create [--client <id> --name <name> --currency <code>]
//                                         list clients, or create a project with this repository
//     --replace           change a link that points at another project
//     --set-environment   also write the environment this machine points at
//
// Factory answers through its MCP with the machine token. Only the reduced
// repository (provider and owner/name) leaves the machine, never the raw
// remote. The output reaches the chat: the person's name, their own projects
// and the clients they can see, never the token. crew.json is shared by the
// team, and creating a project changes factory, so the agent asks the person
// before every writing form.
const { basename } = require("node:path");
const { loadConfig, configDir } = require("../hooks/lib/config");
const { resolveFactory } = require("../hooks/lib/factory-env");
const { factoryToken } = require("../hooks/lib/factory");
const { callTool, listTools, FactoryError } = require("../hooks/lib/factory-mcp");
const { repoIdentity } = require("./lib/repo-remote");
const { list, link, write, prepare, say, refuse, UUID } = require("./lib/factory-link-write");

const VALUE_FLAGS = new Set(["--client", "--name", "--currency"]);
// What the MCP answers for a tool the caller's profile does not get.
const MISSING_TOOL = /\btool\b[^.]*\bnot found\b|unknown tool/i;
const DENIED = /permission|forbidden|not allowed|denied/i;
const NOT_YOURS = "This repository belongs to a factory project you are not part of.";

function parse(argv) {
  const flags = new Set();
  const values = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (VALUE_FLAGS.has(argv[i])) values[argv[i].slice(2)] = argv[++i];
    else if (argv[i].startsWith("--")) flags.add(argv[i]);
    else rest.push(argv[i]);
  }
  return { flags, values, id: rest[0] };
}

// { value } or { missing: true } when the profile has no such tool: it is not
// among the tools factory lists for this caller, or factory refuses it.
async function tool(ctx, name, args) {
  if (!ctx.tools.has(name)) return { missing: true };
  try {
    return { value: (await callTool(ctx.target.api, ctx.token, name, args)) || {} };
  } catch (error) {
    if (error instanceof FactoryError && (MISSING_TOOL.test(error.message) || DENIED.test(error.message))) return { missing: true };
    throw error;
  }
}

// A project factory names as the person's must be one whoami lists.
const ownProject = (me, project) =>
  project && UUID.test(String(project.id)) ? me.projects.find((p) => p.id.toLowerCase() === project.id.toLowerCase()) : null;

const repoArgs = (identity) => ({ provider: identity.provider, repo: identity.repo });

async function resolve(ctx) {
  const { me, cfg, dir, target, flags, identity } = ctx;
  const current = cfg.factory && cfg.factory.projectId;
  if (current && !flags.has("--replace")) {
    const project = me.projects.find((p) => p.id === current);
    return say(`This repository is already linked to ${project ? `the factory project ${project.name} (${current})` : current}. ` +
      "Add --replace to look it up again.");
  }
  if (!identity.provider) {
    return list(me, cfg, target, ["", identity.unrecognized ? "This repository's remote is not one factory can recognize, so pick the project by hand."
      : "This repository has no git remote, so pick the project by hand."]);
  }
  const found = await tool(ctx, "find_project_by_repo", repoArgs(identity));
  if (found.missing) return list(me, cfg, target, ["", "This factory does not look projects up by repository yet, so pick the project by hand."]);
  if (found.value.match === "yours") {
    const project = ownProject(me, found.value.project);
    if (!project) return refuse("Factory named a project that is not among yours; nothing was written. Pick the project by hand.");
    return write(project, cfg, dir, target, flags, `, found from the repository ${identity.repo}`);
  }
  if (found.value.match === "other") {
    return say(`${NOT_YOURS} To ask its lead or coordinator for access, run /crew:factory link --request-access.`);
  }
  const canCreate = ctx.tools.has("create_project") && ctx.tools.has("list_clients");
  return list(me, cfg, target, ["", `No factory project has the repository ${identity.repo} yet.`, !canCreate
    ? "Creating a project needs permission to create projects: Gestión creates them in the app. Once it exists, /crew:factory link finds it."
    : "To create a new project with this repository, run /crew:factory link --create."]);
}

// The manual pick, then the repository registered on it when the person may.
async function pick(ctx) {
  const { me, cfg, dir, target, flags, identity } = ctx;
  const code = link(me, cfg, dir, target, ctx.id, flags);
  if (code || !identity.provider) return code;
  const result = await tool(ctx, "register_project_repo", { projectId: ctx.id, ...repoArgs(identity) });
  if (result.value && result.value.registered) {
    return say(`Registered the repository ${identity.repo} on that project, so the next link of this repository finds it on its own.`);
  }
  if (result.value && result.value.reason === "taken") {
    return say(`Factory has the repository ${identity.repo} on a project you are not part of. crew.json points at your pick; ` +
      "Gestión settles which project the repository belongs to.");
  }
  return say(`The repository ${identity.repo} stays unregistered in factory: registering it needs permission to manage the ` +
    "project's technical assets. The project lead can add it, so the next link finds it on its own.");
}

async function requestAccess(ctx) {
  if (!ctx.identity.provider) return refuse("Asking for access needs a git remote factory can recognize.");
  const result = await tool(ctx, "request_project_access", repoArgs(ctx.identity));
  if (result.missing || !result.value.requested) return refuse("This factory does not take access requests from crew yet; ask the project lead directly.");
  return say("Asked for access. The request reaches the project's lead or coordinator; once they approve it, run /crew:factory link again.");
}

// Every check that could refuse the link runs before factory creates
// anything, so a refusal never leaves a project without its repository linked.
async function create(ctx) {
  const { cfg, dir, target, flags, values, identity } = ctx;
  if (!identity.provider) return refuse("Creating a project from crew registers this repository on it, so it needs a git remote factory can recognize.");
  const clients = ctx.tools.has("create_project") ? await tool(ctx, "list_clients", {}) : { missing: true };
  if (clients.missing) return refuse("Creating a project needs permission to create projects: Gestión creates them in the app.");
  const all = clients.value.clients || [];
  const name = values.name || basename(identity.repo);
  const currency = values.currency || clients.value.defaultCurrency;
  if (!values.client) {
    return say([`Clients you can create a project for (factory ${target.name}):`, ...all.map((c) => `- ${c.name} — ${c.id}`), "",
      `To create it, run /crew:factory link --create --client <client id>, with --name (default "${name}") and --currency ` +
      (currency ? `(default ${currency}).` : "<code> (factory gave no default)."), "Creating it also registers this repository on it."].join("\n"));
  }
  if (!all.some((c) => c.id === values.client)) return refuse(`${values.client} is not among the clients you can create a project for.`);
  if (!currency) return refuse("Factory gave no default currency for the organization; add --currency <code>.");
  const check = prepare(cfg, target, flags, null, `a new project "${name}"`);
  if (check.error) return refuse(check.error);
  const created = await tool(ctx, "create_project", { name, clientId: values.client, currency, ...repoArgs(identity) });
  const project = created.value && created.value.project;
  if (created.missing || !project || !UUID.test(String(project.id))) return refuse("Factory did not create the project.");
  return write({ id: project.id, name: project.name || name }, cfg, dir, target, flags,
    `, a new project created with the repository ${identity.repo}`);
}

async function main() {
  const { flags, values, id } = parse(process.argv.slice(2));
  const dir = configDir(process.cwd());
  const cfg = dir && loadConfig(dir);
  if (!cfg) return refuse("This folder has no crew.json. Run /crew:setup first, then /crew:factory link.");
  const target = resolveFactory(cfg.factory);
  const token = factoryToken();
  if (!token) return refuse(`This machine is not connected to factory ${target.name}. Run /crew:factory login first.`);
  const ctx = { cfg, dir, target, token, flags, values, id, identity: repoIdentity(dir) };
  try {
    ctx.tools = await listTools(target.api, token);
    ctx.me = await callTool(target.api, token, "whoami");
    if (!ctx.me || !ctx.me.person) return refuse("Factory has no person record for your user; ask Gestión to link one.");
    ctx.me.projects = ctx.me.projects || [];
    if (flags.has("--request-access")) return await requestAccess(ctx);
    if (flags.has("--create")) return await create(ctx);
    return id ? await pick(ctx) : await resolve(ctx);
  } catch (error) {
    return refuse(error instanceof FactoryError ? `Could not reach your projects: ${error.message}.`
      : `Could not reach your projects: factory ${target.name} (${target.api}) did not answer.`);
  }
}

if (require.main === module) main().then((code) => { process.exitCode = code; });
module.exports = { link, list, parse };
