#!/usr/bin/env node
// Links the current repository to one of the person's factory projects.
//
//   node factory-link.js                 list the projects the person takes part in
//   node factory-link.js <projectId>     write factory.projectId into crew.json
//     --replace           change a link that points at another project
//     --set-environment   also write the environment this machine points at
//
// The project list comes from factory's MCP (whoami) with the machine token.
// The output reaches the chat: it names the person and their own projects,
// never the token. crew.json is shared by the team, so the agent asks the
// person before running the writing form.
const { loadConfig, configDir } = require("../hooks/lib/config");
const { resolveFactory } = require("../hooks/lib/factory-env");
const { factoryToken } = require("../hooks/lib/factory");
const { callTool, FactoryError } = require("../hooks/lib/factory-mcp");
const { writeFactoryBlock } = require("../hooks/lib/config-write");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function say(line) { console.log(line); return 0; }
function refuse(line) { console.log(line); return 1; }

// The environment crew.json would pick, ignoring this machine's variables.
const sharedEnvironment = (cfg) => resolveFactory(cfg.factory, {}).name;

function list(me, cfg, target) {
  const current = cfg.factory && cfg.factory.projectId;
  const lines = [`Factory projects ${me.person.name} takes part in (factory ${target.name}):`];
  for (const p of me.projects) {
    const marks = [p.id === current && "linked here", p.id === me.defaultProjectId && "most recent"].filter(Boolean);
    lines.push(`- ${p.name} — ${p.id}${marks.length ? ` (${marks.join(", ")})` : ""}`);
  }
  if (!me.projects.length) lines.push("- none: ask the project lead to add you to the project or to one of its squads.");
  else lines.push("", "To link this repository, run /crew:factory link <project id>.");
  return say(lines.join("\n"));
}

function link(me, cfg, dir, target, id, flags) {
  if (!UUID.test(id)) return refuse(`"${id}" is not a factory project id. Run /crew:factory link to list yours.`);
  const project = me.projects.find((p) => p.id.toLowerCase() === id.toLowerCase());
  if (!project) return refuse(`${id} is not among your projects in factory ${target.name}. Run /crew:factory link to list yours.`);
  const current = cfg.factory && cfg.factory.projectId;
  if (current && current !== project.id && !flags.has("--replace")) {
    return refuse(`This repository is already linked to ${current}. Add --replace to link it to ${project.name} instead.`);
  }
  const patch = { projectId: project.id };
  const shared = sharedEnvironment(cfg);
  if (target.name !== shared) {
    if (!flags.has("--set-environment") || target.name === "custom") {
      return refuse(`This machine points at factory ${target.name} (a machine variable), while crew.json points the team at ` +
        `${shared}. Project ids differ between environments.` +
        (target.name === "custom" ? " Set the url in crew.json yourself if the team uses it."
          : ` Add --set-environment to write "environment": "${target.name}" too.`));
    }
    patch.environment = target.name;
  }
  writeFactoryBlock(dir, patch);
  return say(`Linked this repository to the factory project ${project.name} (${project.id}) in crew.json` +
    `${patch.environment ? `, environment ${patch.environment}` : ""}. Commit crew.json so the team shares the link.`);
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const id = args.find((a) => !a.startsWith("--"));
  const dir = configDir(process.cwd());
  const cfg = dir && loadConfig(dir);
  if (!cfg) return refuse("This folder has no crew.json. Run /crew:setup first, then /crew:factory link.");
  const target = resolveFactory(cfg.factory);
  const token = factoryToken();
  if (!token) return refuse(`This machine is not connected to factory ${target.name}. Run /crew:factory login first.`);
  let me;
  try {
    me = await callTool(target.api, token, "whoami");
  } catch (error) {
    return refuse(error instanceof FactoryError ? `Could not list your projects: ${error.message}.`
      : `Could not list your projects: factory ${target.name} (${target.api}) did not answer.`);
  }
  if (!me || !me.person) return refuse("Factory has no person record for your user; ask Gestión to link one.");
  me.projects = me.projects || [];
  return id ? link(me, cfg, dir, target, id, flags) : list(me, cfg, target);
}

if (require.main === module) main().then((code) => { process.exitCode = code; });
module.exports = { link, list };
