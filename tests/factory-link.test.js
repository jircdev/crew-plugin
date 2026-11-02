const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { factory, tempHome, runScript, TOKEN, PROJECTS } = require('./fixtures/factory-fake');
const { link: linkTo } = require('../scripts/factory-link');

const [PORTAL, FACTORY] = PROJECTS;

// A repository whose crew.json points the team at the fake factory (or has
// no crew.json), and a connected machine with no factory variables of its own.
function setup(t, fake, crew = { mode: 'team', quality: 'advise' }) {
  const home = tempHome(t);
  const repo = tempHome(t);
  if (crew) {
    const shared = { ...crew, factory: { ...(crew.factory || {}), url: fake.api } };
    fs.writeFileSync(path.join(repo, 'crew.json'), JSON.stringify(shared, null, 4) + '\n');
  }
  fs.writeFileSync(path.join(home, 'factory-token'), TOKEN);
  return { home, repo };
}
const link = (s, fake, args, env = {}) =>
  runScript('factory-link', args, { home: s.home, cwd: s.repo, api: fake.api, env: { CREW_FACTORY_URL: '', ...env } });
const status = (s, fake) =>
  runScript('factory-login', ['status'], { home: s.home, cwd: s.repo, api: fake.api, env: { CREW_FACTORY_URL: '' } });
const crewJson = (s) => fs.readFileSync(path.join(s.repo, 'crew.json'), 'utf8');

test('link lists the person\'s own projects by name and id, and nothing else', async t => {
  const fake = await factory(t);
  const out = await link(setup(t, fake), fake, []);
  assert.equal(out.status, 0, out.stdout);
  assert.match(out.stdout, /Factory projects Ana takes part in/);
  assert.match(out.stdout, new RegExp(`- Portal — ${PORTAL.id}`));
  assert.match(out.stdout, new RegExp(`- Factory — ${FACTORY.id}`));
  for (const secret of [TOKEN, 'Budget', '#000', 'photoUrl']) assert.equal(out.stdout.includes(secret), false, secret);
  assert.deepEqual(fake.seen.mcp, [{ name: 'whoami', accept: 'application/json, text/event-stream' }]);
});

test('link with an id writes projectId, keeping the other keys, the indentation and no BOM', async t => {
  const fake = await factory(t);
  const s = setup(t, fake, { mode: 'team', quality: 'advise', factory: { capture: true } });
  const out = await link(s, fake, [FACTORY.id]);
  assert.equal(out.status, 0, out.stdout);
  assert.match(out.stdout, /Linked this repository to the factory project Factory/);
  const text = crewJson(s);
  assert.notEqual(text.charCodeAt(0), 0xfeff);
  assert.match(text, /\n {4}"mode": "team"/);
  assert.deepEqual(JSON.parse(text), { mode: 'team', quality: 'advise', factory: { capture: true, url: fake.api, projectId: FACTORY.id } });
  assert.match((await link(s, fake, [])).stdout, /Factory — .* \(linked here\)/);
});

test('link refuses without crew.json, for a project that is not the person\'s, and over another link without --replace', async t => {
  const fake = await factory(t);
  assert.match((await link(setup(t, fake, null), fake, [])).stdout, /no crew\.json\. Run \/crew:setup/);
  assert.equal(fake.seen.mcp.length, 0);
  const s = setup(t, fake, { factory: { projectId: PORTAL.id } });
  const foreign = await link(s, fake, ['33333333-4444-4555-8666-777777777777']);
  assert.equal(foreign.status, 1);
  assert.match(foreign.stdout, /not among your projects/);
  assert.match((await link(s, fake, [FACTORY.id])).stdout, /already linked to .* Add --replace/);
  assert.equal(JSON.parse(crewJson(s)).factory.projectId, PORTAL.id);
  assert.equal((await link(s, fake, [FACTORY.id, '--replace'])).status, 0);
  assert.equal(JSON.parse(crewJson(s)).factory.projectId, FACTORY.id);
});

test('an environment chosen by a machine variable reaches crew.json only on request', t => {
  const repo = tempHome(t);
  const before = JSON.stringify({ mode: 'team' }, null, 2) + '\n';
  fs.writeFileSync(path.join(repo, 'crew.json'), before);
  const me = { person: { name: 'Ana' }, projects: PROJECTS };
  const cfg = { factory: null };
  const write = (target, flags) => linkTo(me, cfg, repo, target, PORTAL.id, new Set(flags));
  assert.equal(write({ name: 'dev' }, []), 1);
  assert.equal(write({ name: 'custom' }, ['--set-environment']), 1);
  assert.equal(fs.readFileSync(path.join(repo, 'crew.json'), 'utf8'), before);
  assert.equal(write({ name: 'dev' }, ['--set-environment']), 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(repo, 'crew.json'), 'utf8')).factory,
    { projectId: PORTAL.id, environment: 'dev' });
});

test('status names the linked project, or says the repository is not linked', async t => {
  const fake = await factory(t);
  const linked = await status(setup(t, fake, { factory: { projectId: PORTAL.id } }), fake);
  assert.match(linked.stdout, /as Ana/);
  assert.match(linked.stdout, new RegExp(`linked to the factory project Portal \\(${PORTAL.id}\\)`));
  const unlinked = await status(setup(t, fake), fake);
  assert.match(unlinked.stdout, /not linked to a factory project\. Run \/crew:factory link/);
});

test('a token factory refuses gets a sentence the person can act on', async t => {
  const fake = await factory(t, { token: 'fct_someone_else' });
  const out = await link(setup(t, fake), fake, []);
  assert.equal(out.status, 1);
  assert.match(out.stdout, /Could not list your projects: factory rejected the token/);
});
