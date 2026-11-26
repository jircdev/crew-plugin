// `- **Factory:** skip` in the header keeps a work item out of factory on
// purpose: the control for a requirement on a sensitive subject (a person,
// pay, health, a security incident). Nothing of the file is sent, and the
// line answers the link question the way a `**Factory activity:**` link does.
const HEADER_LINES = 40;

function factorySkipped(text) {
  const head = String(text || "").split("\n").slice(0, HEADER_LINES).join("\n").split(/^##\s/m)[0];
  return /^\s*-\s+\*\*Factory:\*\*\s*skip\b/im.test(head);
}

module.exports = { factorySkipped };
