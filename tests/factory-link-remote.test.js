const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { factory, tempHome, runScript, TOKEN, PROJECTS } = require('./fixtures/factory-fake');

const [PORTAL] = PROJECTS;
const SECRET = 'ghp_' + 'q'.repeat(36);
const REMOTE = `https://julio:${SECRET}@github.com/Baleares/Portal.git`;
const REPO = { provider: 'github', repo: 'baleares/portal' };
const NEW_ID = '44444444-5555-4666-8777-888888888888';

// A git repository with crew.json pointing at the fake, a remote carrying a
// token, and a connected machine.
function setup(t, fake, remote = REMOTE) {
  const home = tempHome(t);
  const repo = tempHome(t);
  execFileSync('git', ['init', '-q', repo]);
  if (remote) execFileSync('git', ['-C', repo, 'remote', 'add', 'origin', remote]);
  fs.writeFileSync(path.join(repo, 'crew.json'), JSON.stringify({ mode: 'team', factory: { url: fake.api } }, null, 2) + '\n');
  fs.writeFileSync(path.join(home, 'factory-token'), TOKEN);
  return { home, repo };
}
const link = (s, fake, args = []) =>
  runScript('factory-link', args, { home: s.home, cwd: s.repo, api: fake.api, env: { CREW_FACTORY_URL: '' } });
const linked = (s) => JSON.parse(fs.readFileSync(path.join(s.repo, 'crew.json'), 'utf8')).factory.projectId;
// Nothing that reached factory, the chat or crew.json carries the remote's credential.
function clean(fake, s, out) {
  const all = fake.seen.calls.map((c) => c.raw).join('\n') + out.stdout + fs.readFileSync(path.join(s.repo, 'crew.json'), 'utf8');
  assert.equal(all.includes(SECRET) || all.includes('julio'), false);
}

test('a repository factory has on one of the person\'s projects is linked without asking', async t => {
  const fake = await factory(t, { tools: { find_project_by_repo: () => ({ match: 'yours', project: { id: PORTAL.id, name: PORTAL.name } }) } });
  const s = setup(t, fake);
  const out = await link(s, fake);
  assert.equal(out.status, 0, out.stdout);
  assert.match(out.stdout, /Linked this repository to the factory project Portal .* found from the repository baleares\/portal/);
  assert.equal(linked(s), PORTAL.id);
  assert.deepEqual(fake.seen.calls.find((c) => c.name === 'find_project_by_repo').args, REPO);
  clean(fake, s, out);
});

test('a repository of a project the person is not in gets the same opaque answer, and access can be asked for', async t => {
  const asked = [];
  const fake = await factory(t, { tools: { find_project_by_repo: () => ({ match: 'other' }),
    request_project_access: (args) => { asked.push(args); return { requested: true }; } } });
  const s = setup(t, fake);
  const out = await link(s, fake);
  assert.match(out.stdout, /belongs to a factory project you are not part of\. .* --request-access/);
  assert.equal(linked(s), undefined);
  const request = await link(s, fake, ['--request-access']);
  assert.match(request.stdout, /Asked for access\. The request reaches the project's lead or coordinator/);
  assert.deepEqual(asked, [REPO]);
  clean(fake, s, request);
});

test('without a match it lists the person\'s projects, and offers creating one only to who may', async t => {
  const none = { find_project_by_repo: () => ({ match: 'none' }) };
  const plain = await factory(t, { tools: none });
  const out = await link(setup(t, plain), plain);
  assert.match(out.stdout, /- Portal — /);
  assert.match(out.stdout, /No factory project has the repository baleares\/portal yet/);
  assert.match(out.stdout, /Gestión creates them in the app/);
  const reader = await factory(t, { tools: { ...none, list_clients: () => ({ clients: [] }) } });
  assert.match((await link(setup(t, reader), reader)).stdout, /Gestión creates them in the app/, 'reading clients is not creating projects');
  const creator = await factory(t, { tools: { ...none, list_clients: () => ({ clients: [{ id: 'c1', name: 'Acme' }] }), create_project: () => ({}) } });
  assert.match((await link(setup(t, creator), creator)).stdout, /run \/crew:factory link --create/);
});

test('the manual pick registers the repository, or says it stays unregistered', async t => {
  const registered = await factory(t, { tools: { register_project_repo: () => ({ registered: true }) } });
  const s = setup(t, registered);
  const out = await link(s, registered, [PORTAL.id]);
  assert.match(out.stdout, /Registered the repository baleares\/portal on that project/);
  assert.deepEqual(registered.seen.calls.find((c) => c.name === 'register_project_repo').args, { projectId: PORTAL.id, ...REPO });
  for (const [tools, expected] of [[{ register_project_repo: () => ({ registered: false, reason: 'forbidden' }) }, /stays unregistered in factory/],
    [{}, /stays unregistered in factory/], [{ register_project_repo: () => ({ registered: false, reason: 'taken' }) }, /Gestión settles/]]) {
    const fake = await factory(t, { tools });
    const pick = setup(t, fake);
    const result = await link(pick, fake, [PORTAL.id]);
    assert.match(result.stdout, expected);
    assert.equal(linked(pick), PORTAL.id);
  }
});

test('creating a project lists clients first, then creates it with the repository and links it', async t => {
  const created = [];
  const fake = await factory(t, { tools: { list_clients: () => ({ clients: [{ id: 'c1', name: 'Acme' }], defaultCurrency: 'USD' }),
    create_project: (args) => { created.push(args); return { project: { id: NEW_ID, name: args.name } }; } } });
  const s = setup(t, fake);
  const listed = await link(s, fake, ['--create']);
  assert.match(listed.stdout, /- Acme — c1/);
  assert.match(listed.stdout, /--name \(default "portal"\) and --currency \(default USD\)/);
  assert.match(listed.stdout, /also registers this repository/);
  assert.equal(created.length, 0);
  assert.equal((await link(s, fake, ['--create', '--client', 'c9'])).status, 1);
  const out = await link(s, fake, ['--create', '--client', 'c1', '--name', 'Portal web']);
  assert.match(out.stdout, /Linked this repository to the factory project Portal web .* a new project created/);
  assert.deepEqual(created, [{ name: 'Portal web', clientId: 'c1', currency: 'USD', ...REPO }]);
  assert.equal(linked(s), NEW_ID);
  clean(fake, s, out);
});

test('factory naming a project that is not the person\'s writes nothing', async t => {
  const stranger = { id: '99999999-0000-4000-8000-000000000000', name: 'Other' };
  const fake = await factory(t, { tools: { find_project_by_repo: () => ({ match: 'yours', project: stranger }) } });
  const s = setup(t, fake);
  const out = await link(s, fake);
  assert.equal(out.status, 1);
  assert.match(out.stdout, /not among yours; nothing was written/);
  assert.equal(linked(s), undefined);
});

test('a link that would be refused stops before factory creates a project', async t => {
  const created = [];
  const fake = await factory(t, { tools: { list_clients: () => ({ clients: [{ id: 'c1', name: 'Acme' }], defaultCurrency: 'USD' }),
    create_project: (args) => { created.push(args); return { project: { id: NEW_ID, name: args.name } }; } } });
  const s = setup(t, fake);
  fs.writeFileSync(path.join(s.repo, 'crew.json'), JSON.stringify({ factory: { url: fake.api, projectId: PORTAL.id } }));
  assert.match((await link(s, fake, ['--create', '--client', 'c1'])).stdout, /already linked/);
  assert.equal(created.length, 0);
  const bare = await factory(t, { tools: { list_clients: () => ({ clients: [{ id: 'c1', name: 'Acme' }] }), create_project: () => ({}) } });
  assert.match((await link(setup(t, bare), bare, ['--create', '--client', 'c1'])).stdout, /add --currency <code>/);
});

test('without a remote, or with one factory cannot read, the person picks by hand', async t => {
  const fake = await factory(t);
  assert.match((await link(setup(t, fake, null), fake)).stdout, /no git remote, so pick the project by hand/);
  const odd = await link(setup(t, fake, '/srv/git/app.git'), fake);
  assert.match(odd.stdout, /not one factory can recognize/);
  assert.equal(odd.stdout.includes('/srv/git'), false);
  assert.equal(fake.seen.calls.some((c) => c.name === 'find_project_by_repo'), false);
});
