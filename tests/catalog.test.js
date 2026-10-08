const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { scan } = require('../scripts/check-supply-chain');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n');
const list = rel => fs.readdirSync(path.join(root, rel));

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2];
  }
  return fields;
}
// YAML plain scalars cannot contain ": " — the 0.25 regression that made the
// hosted validator reject eight agents. Quoted values are fine.
function unsafeScalar(value) {
  return value && !/^["']/.test(value) && /:\s/.test(value);
}

const roles = list('agents').map(f => f.replace(/\.md$/, ''));
const commands = list('commands').filter(f => f.endsWith('.md'));
const active = commands.filter(f => !/Retired alias/.test(frontmatter(read(`commands/${f}`)).description || ''));

test('registration completeness: every role has a command, an alias row, EN/ES catalog entries and a Codex skill', () => {
  const agentsTable = read('templates/AGENTS.md');
  const en = read('docs/en/roles.md');
  const es = read('docs/es/roles.md');
  for (const role of roles) {
    const command = active.find(f => read(`commands/${f}`).includes(role));
    assert.ok(command, `${role}: no active command spawns it`);
    const alias = command.replace(/\.md$/, '');
    assert.match(agentsTable, new RegExp(`\\| \`[A-Z]+\` \\| ${role} \\|`), `${role}: no alias row in templates/AGENTS.md`);
    assert.ok(en.includes(role), `${role}: missing from docs/en/roles.md`);
    assert.ok(es.includes(role), `${role}: missing from docs/es/roles.md`);
    assert.ok(read(`skills/${alias}/SKILL.md`).includes(`agents/${role}.md`), `${role}: Codex skill does not link it`);
  }
});

test('retired aliases redirect to a role or craft that exists', () => {
  for (const f of commands.filter(f => !active.includes(f))) {
    const target = read(`commands/${f}`).match(/use \/crew:([a-z]+)/);
    if (target) assert.ok(commands.includes(`${target[1]}.md`), `${f}: redirects to missing /crew:${target[1]}`);
    else assert.match(read(`commands/${f}`), /skill/, `${f}: redirect names neither a command nor a skill`);
  }
});

test('frontmatter: agents, commands and skills carry valid, YAML-safe metadata', () => {
  for (const role of roles) {
    const fm = frontmatter(read(`agents/${role}.md`));
    assert.ok(fm, `${role}: no frontmatter`);
    assert.equal(fm.name, role, `${role}: name does not match the file`);
    assert.ok(['opus', 'sonnet', 'haiku'].includes(fm.model), `${role}: model must be opus, sonnet or haiku`);
    for (const [k, v] of Object.entries(fm)) assert.ok(!unsafeScalar(v), `${role}: unquoted ${k} contains ": "`);
  }
  for (const f of commands) {
    const fm = frontmatter(read(`commands/${f}`));
    assert.ok(fm && fm.description, `${f}: missing description`);
    assert.ok(!unsafeScalar(fm.description), `${f}: unquoted description contains ": "`);
  }
  for (const dir of list('skills')) {
    const fm = frontmatter(read(`skills/${dir}/SKILL.md`));
    assert.ok(fm, `skills/${dir}: no frontmatter`);
    assert.equal(fm.name, dir, `skills/${dir}: name does not match the directory`);
    assert.ok(fm.description && !unsafeScalar(fm.description), `skills/${dir}: missing or unsafe description`);
  }
});

test('model assignment follows the written rule in the CREW role', () => {
  const rule = read('agents/crew.md').match(/the `sonnet` roles are exactly ([^.]+)\./);
  assert.ok(rule, 'agents/crew.md must name the sonnet roles');
  const sonnet = [...rule[1].matchAll(/`([a-z-]+)`/g)].map(m => m[1]).sort();
  const actual = roles.filter(r => frontmatter(read(`agents/${r}.md`)).model === 'sonnet').sort();
  assert.deepEqual(actual, sonnet);
});

test('every manifest carries the same version, and the changelog documents it', () => {
  const version = JSON.parse(read('.claude-plugin/plugin.json')).version;
  assert.equal(JSON.parse(read('.claude-plugin/marketplace.json')).plugins[0].version, version);
  assert.equal(JSON.parse(read('.codex-plugin/plugin.json')).version, version);
  assert.match(read('CHANGELOG.md'), new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm'));
  const migrations = JSON.parse(read('migrations.json')).migrations.map(m => m.version);
  assert.deepEqual([...migrations].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), migrations, 'migrations.json out of order');
});

test('shipped files carry no hidden characters and no personal paths', () => {
  assert.deepEqual(scan(), []);
});

test('the hygiene scan catches bidi controls and personal paths, and spares documented placeholders', t => {
  const os = require('node:os');
  const file = path.join(os.tmpdir(), `crew-scan-${process.pid}.md`);
  t.after(() => fs.rmSync(file, { force: true }));
  const sep = path.win32.sep;
  fs.writeFileSync(file, [`ok ${String.fromCodePoint(0x202e)} reversed`,
    ['see C:', 'Users', 'maintainer', 'repo'].join(sep), ['see C:', 'Users', '<you>', 'repo'].join(sep), ''].join('\n'));
  const findings = scan([file]);
  assert.equal(findings.length, 2);
  assert.match(findings[0], /U\+202E/);
  assert.match(findings[1], /personal path/);
});
