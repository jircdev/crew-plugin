// The two answers of /crew:factory link that need no repository remote: the
// list of the person's own projects, and writing one of them into crew.json.
// The output reaches the chat: it names the person and their own projects,
// never the token.
const { resolveFactory } = require("../../hooks/lib/factory-env");
const { writeFactoryBlock } = require("../../hooks/lib/config-write");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function say(line) { console.log(line); return 0; }
function refuse(line) { console.log(line); return 1; }

// The environment crew.json would pick, ignoring this machine's variables.
const sharedEnvironment = (cfg) => resolveFactory(cfg.factory, {}).name;

function list(me, cfg, target, extra = []) {
  const current = cfg.factory && cfg.factory.projectId;
  const lines = [`Factory projects ${me.person.name} takes part in (factory ${target.name}):`];
  for (const p of me.projects) {
    const marks = [p.id === current && "linked here", p.id === me.defaultProjectId && "most recent"].filter(Boolean);
    lines.push(`- ${p.name} — ${p.id}${marks.length ? ` (${marks.join(", ")})` : ""}`);
  }
  if (!me.projects.length) lines.push("- none: ask the project lead to add you to the project or to one of its squads.");
  else lines.push("", "To link this repository, run /crew:factory link <project id>.");
  return say(lines.concat(extra).join("\n"));
}

// The crew.json patch for linking `projectId`, or the reason it may not be
// written. Checked before anything changes in factory (a project is created
// only once its link can be written).
function prepare(cfg, target, flags, projectId, name = "it") {
  const current = cfg.factory && cfg.factory.projectId;
  if (current && current !== projectId && !flags.has("--replace")) {
    return { error: `This repository is already linked to ${current}. Add --replace to link it to ${name} instead.` };
  }
  const patch = { projectId };
  const shared = sharedEnvironment(cfg);
  if (target.name !== shared) {
    if (!flags.has("--set-environment") || target.name === "custom") {
      return { error: `This machine points at factory ${target.name} (a machine variable), while crew.json points the team at ` +
        `${shared}. Project ids differ between environments.` +
        (target.name === "custom" ? " Set the url in crew.json yourself if the team uses it."
          : ` Add --set-environment to write "environment": "${target.name}" too.`) };
    }
    patch.environment = target.name;
  }
  return { patch };
}

// Writes project.id into crew.json, or refuses with the reason. `project` must
// be one of the person's own: from whoami, from the repo lookup or just created.
function write(project, cfg, dir, target, flags, how = "") {
  const { error, patch } = prepare(cfg, target, flags, project.id, project.name);
  if (error) return refuse(error);
  writeFactoryBlock(dir, patch);
  return say(`Linked this repository to the factory project ${project.name} (${project.id}) in crew.json${how}` +
    `${patch.environment ? `, environment ${patch.environment}` : ""}. Commit crew.json so the team shares the link.`);
}

// The manual pick: only a project the person takes part in.
function link(me, cfg, dir, target, id, flags) {
  if (!UUID.test(id)) return refuse(`"${id}" is not a factory project id. Run /crew:factory link to list yours.`);
  const project = me.projects.find((p) => p.id.toLowerCase() === id.toLowerCase());
  if (!project) return refuse(`${id} is not among your projects in factory ${target.name}. Run /crew:factory link to list yours.`);
  return write(project, cfg, dir, target, flags);
}

module.exports = { list, link, write, prepare, say, refuse, UUID };
