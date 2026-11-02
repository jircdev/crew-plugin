const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { reduceRemote, repoIdentity } = require('../scripts/lib/repo-remote');
const { tempHome } = require('./fixtures/factory-fake');

const SECRET = 'ghp_' + 'z'.repeat(36);

test('https, ssh and scp remotes of one GitHub repository reduce to the same id', () => {
  const forms = ['https://github.com/Baleares/Factory.git', 'https://github.com/baleares/factory', 'https://github.com/baleares/factory/',
    'git@github.com:Baleares/factory.git', 'ssh://git@github.com:22/baleares/factory.git', 'https://www.github.com/baleares/factory/tree/main'];
  for (const remote of forms) assert.deepEqual(reduceRemote(remote), { provider: 'github', repo: 'baleares/factory' }, remote);
});

test('a credential in the remote never survives the reduction', () => {
  for (const remote of [`https://julio:${SECRET}@github.com/baleares/factory.git`, `https://${SECRET}@gitlab.example.com:8443/team/app.git?x=${SECRET}#${SECRET}`]) {
    const reduced = reduceRemote(remote);
    assert.ok(reduced, remote);
    assert.equal(JSON.stringify(reduced).includes(SECRET), false);
    assert.equal(JSON.stringify(reduced).includes('julio'), false);
  }
  assert.deepEqual(reduceRemote(`https://${SECRET}@gitlab.example.com:8443/team/app.git`), { provider: 'other', repo: 'gitlab.example.com/team/app' });
});

test('a remote that cannot be reduced is refused, never echoed', () => {
  assert.deepEqual(reduceRemote('https://gitlab.example.com/team/app/-/tree/main'), { provider: 'other', repo: 'gitlab.example.com/team/app' });
  for (const remote of ['', 'git@github.com:owner/../x', '/srv/git/app.git', 'C:\\repos\\app', 'https://github.com/only-owner', 'not a url']) {
    assert.equal(reduceRemote(remote), null, remote);
  }
});

function repo(t, remotes) {
  const dir = tempHome(t);
  execFileSync('git', ['init', '-q', dir]);
  for (const [name, url] of remotes) execFileSync('git', ['-C', dir, 'remote', 'add', name, url]);
  return dir;
}

test('the identity comes from origin, or from the only remote; none and unrecognized are told apart', t => {
  assert.deepEqual(repoIdentity(repo(t, [['upstream', 'git@github.com:a/b.git'], ['origin', 'https://github.com/c/d']])),
    { provider: 'github', repo: 'c/d' });
  assert.deepEqual(repoIdentity(repo(t, [['fork', 'https://github.com/e/f.git']])), { provider: 'github', repo: 'e/f' });
  assert.deepEqual(repoIdentity(repo(t, [])), { none: true });
  assert.deepEqual(repoIdentity(repo(t, [['origin', '/srv/git/app.git']])), { unrecognized: true });
  const plain = tempHome(t);
  fs.mkdirSync(path.join(plain, 'sub'));
  assert.deepEqual(repoIdentity(path.join(plain, 'sub')), { none: true });
});
